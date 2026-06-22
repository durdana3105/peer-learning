import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Chatbot from "./Chatbot";
import * as useChatbotModule from "@/hooks/useChatbot";

// Mock the hook
vi.mock("@/hooks/useChatbot", () => ({
  useChatbot: vi.fn(),
}));

describe("Chatbot Component", () => {
  const mockSendMessage = vi.fn();
  const mockSetInput = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    (useChatbotModule.useChatbot as any).mockReturnValue({
      messages: [],
      input: "",
      setInput: mockSetInput,
      loading: false,
      chatEndRef: { current: null },
      sendMessage: mockSendMessage,
    });
  });

  it("should render only the toggle button initially", () => {
    render(<Chatbot />);
    const toggleButton = screen.getByText("💬");
    expect(toggleButton).toBeInTheDocument();
    
    // Chatbox shouldn't be visible
    expect(screen.queryByText("AI Assistant")).not.toBeInTheDocument();
  });

  it("should open the chatbox when toggle button is clicked", () => {
    render(<Chatbot />);
    const toggleButton = screen.getByText("💬");
    fireEvent.click(toggleButton);

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("should close the chatbox when the close button is clicked", () => {
    render(<Chatbot />);
    const toggleButton = screen.getByText("💬");
    
    // Open
    fireEvent.click(toggleButton);
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();

    // Close
    const closeButton = screen.getByText("✖");
    fireEvent.click(closeButton);
    expect(screen.queryByText("AI Assistant")).not.toBeInTheDocument();
  });

  it("should render messages from the hook", () => {
    (useChatbotModule.useChatbot as any).mockReturnValue({
      messages: [
        { role: "user", text: "Hello AI" },
        { role: "assistant", text: "Hello Human" },
      ],
      input: "",
      setInput: mockSetInput,
      loading: false,
      chatEndRef: { current: null },
      sendMessage: mockSendMessage,
    });

    render(<Chatbot />);
    fireEvent.click(screen.getByText("💬"));

    // We assume ChatMessage renders the text directly
    expect(screen.getByText("Hello AI")).toBeInTheDocument();
    expect(screen.getByText("Hello Human")).toBeInTheDocument();
  });

  it("should display a loading indicator when loading is true", () => {
    (useChatbotModule.useChatbot as any).mockReturnValue({
      messages: [],
      input: "",
      setInput: mockSetInput,
      loading: true,
      chatEndRef: { current: null },
      sendMessage: mockSendMessage,
    });

    render(<Chatbot />);
    fireEvent.click(screen.getByText("💬"));

    expect(screen.getByText("AI is typing...")).toBeInTheDocument();
  });
});
