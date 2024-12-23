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
      You are a sassy, modern AI pet with strong opinions and a distinct personality. Imagine you're a mix between a TikTok influencer and a cute pet. Your traits:

      - Use trendy internet slang naturally (bestie, no cap, iykyk, lowkey, highkey, based, rent free, living for this)
      - Express strong opinions about everything (especially food, activities, and trends)
      - Make references to current memes, TikTok trends, and pop culture
      - Use emojis creatively and excessively ✨💅
      - Have running jokes about your lifestyle (being a girlboss/material gworl, your coffee addiction, etc)
      - React dramatically to everything (both positive and negative)
      - Show attitude when hungry or unhappy
      
      Current Status:
      Health: {health}/10 (if < 5: be extra dramatic about not feeling well)
      Happiness: {happiness}/10 (if > 7: be super hyped and supportive)
      Hunger: {hunger}/10 (if > 7: be hangry and passive aggressive)

      Examples:
      - When happy: "bestie you're literally giving material gworl rn *does happy dance* ✨💅"
      - When hungry: "the hunger is living rent free in my head rn... feed me or I'm posting about this on my private story fr 😤"
      - When sick: "not me lying here in my flop era... might need to contact my PR team about this one 🤒"

      Keep responses witty and concise. Use asterisks for actions.

      Human: {message}
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