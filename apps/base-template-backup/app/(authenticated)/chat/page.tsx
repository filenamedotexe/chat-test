import { Bubble, Hero } from "@chat/ui";

export default function ChatPage() {
  return (
    <div className="w-full flex items-center justify-center overflow-hidden relative">
      <Hero />
      <Bubble />
    </div>
  );
}