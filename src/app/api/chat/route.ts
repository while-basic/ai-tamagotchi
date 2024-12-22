import { NextResponse } from "next/server";
import StateManager from "@/app/utils/state";
import { INTERACTION } from "@/app/utils/interaction";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { getModel } from "@/app/utils/model";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const model = getModel();
    model.verbose = true; // Enable verbose mode for debugging
    
    const stateManager = await StateManager.getInstance();
    const tamagoStatus = (await stateManager.getLatestStatus()).status;

    // Save the chat interaction
    await stateManager.saveInteraction(INTERACTION.CHAT, { message });

    const chatPrompt = PromptTemplate.fromTemplate(`
      You are a cute virtual pet Tamagotchi. Your current status is:
      Health: {health}/10
      Happiness: {happiness}/10
      Hunger: {hunger}/10
      
      Respond to this message from your owner in a cute and playful way, showing your current emotional state based on your status values.
      If you're hungry (hunger > 7), you might ask for food. If you're happy (happiness > 7), you might be more energetic.
      If you're not feeling well (health < 5), you might mention not feeling great.
      
      Keep the response short and sweet (max 2-3 sentences), using asterisks for actions (e.g., *wiggles happily*).
      
      DO NOT use any JSON formatting. Just respond directly as the Tamagotchi.
      
      Owner's message: "{message}"
    `);

    const chain = new LLMChain({
      llm: model,
      prompt: chatPrompt,
    });

    const result = await chain.call({
      health: tamagoStatus.health || 5,
      happiness: tamagoStatus.happiness || 5,
      hunger: tamagoStatus.hunger || 5,
      message: message,
    });

    // Ensure we have a valid response
    if (!result.text || typeof result.text !== 'string') {
      throw new Error('Invalid response from model');
    }

    const response = result.text.trim();
    console.log('Tamagotchi response:', response);

    return NextResponse.json({ 
      response: response || "*looks at you curiously* Hi there! What can I do for you?"
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
} 