"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface Message {
  content: string;
  sender: "user" | "tamagotchi";
  timestamp: Date;
  isError?: boolean;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll whenever messages change

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const tamagotchiMessage: Message = {
        content: data.response,
        sender: "tamagotchi",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, tamagotchiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        content: "Oops! I'm having trouble thinking right now. Maybe I need some food or rest? *looks tired*",
        sender: "tamagotchi",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Chat with your Tamagotchi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[300px] overflow-y-auto space-y-4 p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col max-w-[80%] space-y-1",
                message.sender === "user" ? "ml-auto items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-lg px-4 py-2",
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : message.isError
                    ? "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100"
                    : "bg-emerald-500 text-white dark:bg-emerald-600"
                )}
              >
                {message.content}
              </div>
              <span className="text-xs text-gray-500">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Say hello to your Tamagotchi! *waves paw*
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Invisible element to scroll to */}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </Button>
      </CardFooter>
    </Card>
  );
} 