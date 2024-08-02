import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, Message } from '../types';
import '../markdown.css';
import renderDeckInfo from '../utils/renderDeckInfo';
import { useChat } from '../hooks/mutations/useChat';
import FlashcardReviewModal from './modals/FlashcardReviewModal';

interface ChatInterfaceProps {
  card: Card;
  isRevealed: boolean;
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ card, isRevealed, onClose, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [generatedCards, setGeneratedCards] = useState<Array<{ front: string; back: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showModal) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      textareaRef.current?.focus();
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage: Message = { role: 'user', content: input };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');

      const cardContent = `
          Front: ${card.front}
          Back: ${card.back}
          Note: The back of the card is ${isRevealed ? 'revealed' : 'not revealed'} to the user.
      `;

      console.log('Card Content for LLM:', cardContent); // For debugging
      console.log('Messages for LLM:', newMessages); // For debugging

      try {
        const result = await chatMutation.mutateAsync({
          cardContent: cardContent,
          messages: newMessages.slice(1), // Exclude the initial greeting
        });

        const assistantMessage: Message = { role: 'assistant', content: result.response };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error:', error);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleGenerateFlashcards = () => {
    // For now, we'll use dummy data
    const dummyCards = [
      { front: 'What is React?', back: 'A JavaScript library for building user interfaces' },
      { front: 'What is JSX?', back: 'A syntax extension for JavaScript used with React' },
      { front: 'What is a component in React?', back: 'A reusable piece of UI with its own logic and styling' },

      {
        front: '# React Hooks\n\nWhat are the main benefits of using React Hooks?',
        back: "React Hooks offer several advantages:\n\n1. **Reusability**: Hooks allow you to extract component logic into reusable functions.\n\n2. **Readability**: They help organize related logic in one place, making components easier to understand.\n\n3. **Simplicity**: Hooks simplify complex components by reducing the need for class components and lifecycle methods.\n\n4. **Performance**: With hooks like `useMemo` and `useCallback`, you can optimize your component's performance.\n\n5. **Testing**: Hooks make it easier to test your logic independently of your components.\n\nExample of a custom hook:\n```javascript\nfunction useWindowWidth() {\n  const [width, setWidth] = useState(window.innerWidth);\n  \n  useEffect(() => {\n    const handleResize = () => setWidth(window.innerWidth);\n    window.addEventListener('resize', handleResize);\n    return () => window.removeEventListener('resize', handleResize);\n  }, []);\n  \n  return width;\n}\n```",
      },
      {
        front: '# CSS Flexbox\n\nExplain the main concepts of CSS Flexbox and provide an example of its usage.',
        back: "CSS Flexbox is a one-dimensional layout method for arranging items in rows or columns. Main concepts include:\n\n1. **Flex Container**: The parent element that holds flex items.\n2. **Flex Items**: The children of the flex container.\n3. **Main Axis**: The primary axis along which flex items are laid out.\n4. **Cross Axis**: The axis perpendicular to the main axis.\n\nKey properties:\n- `display: flex` (for the container)\n- `flex-direction`\n- `justify-content`\n- `align-items`\n- `flex-grow`, `flex-shrink`, `flex-basis` (for items)\n\nExample:\n```css\n.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n.item {\n  flex: 1 0 auto;\n}\n```\n\nThis creates a flex container with items spaced evenly and vertically centered. Each item will grow to fill available space but won't shrink below its base size.",
      },
      {
        front:
          '# Git Workflow\n\nDescribe a typical Git workflow for collaborating on a project. Include key commands and best practices.',
        back: 'A typical Git workflow might look like this:\n\n1. **Clone the repository**:\n   ```\n   git clone <repository-url>\n   ```\n\n2. **Create a new branch for your feature**:\n   ```\n   git checkout -b feature/new-feature\n   ```\n\n3. **Make changes and commit them**:\n   ```\n   git add .\n   git commit -m "Add new feature"\n   ```\n\n4. **Push your branch to the remote repository**:\n   ```\n   git push -u origin feature/new-feature\n   ```\n\n5. **Create a pull request** on GitHub or your Git hosting platform.\n\n6. **Review and discuss** the changes with your team.\n\n7. **Make any requested changes** and push them to your branch.\n\n8. Once approved, **merge the pull request** into the main branch.\n\n9. **Pull the latest changes** from the main branch:\n   ```\n   git checkout main\n   git pull origin main\n   ```\n\n10. **Delete the feature branch** (locally and remotely):\n    ```\n    git branch -d feature/new-feature\n    git push origin --delete feature/new-feature\n    ```\n\nBest practices:\n- Commit often with clear, descriptive messages\n- Keep branches focused on a single feature or fix\n- Regularly sync your local main branch with the remote\n- Use meaningful branch names (e.g., feature/, bugfix/, hotfix/)\n- Write good pull request descriptions\n- Use code reviews to maintain code quality',
      },
    ];
    setGeneratedCards(dummyCards);
    setCurrentCardIndex(0);
    setShowModal(true);
  };

  const handleAddToDeck = (card: { front: string; back: string }, deckId: string) => {
    // This is where you'd implement the logic to add the card to a deck
    console.log('Adding card to deck:', card, 'Deck ID:', deckId);
    handleNextCard();
  };

  const handleNextCard = () => {
    if (currentCardIndex < generatedCards.length - 1) {
      setCurrentCardIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prevIndex) => prevIndex - 1);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none group relative"
          title="Close chat (Esc)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
          <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Esc to close
          </span>
        </button>
        <div className="text-sm text-gray-500 text-center">{renderDeckInfo(card.decks)}</div>
        <div className="w-6"></div>
      </div>

      <div className="w-full p-6 bg-white mb-4 shadow-sm">
        <div className="text-2xl mb-4 font-semibold flex justify-center">
          <div className="markdown-content text-left">
            <ReactMarkdown>{card.front}</ReactMarkdown>
          </div>
        </div>
        {isRevealed && (
          <div className="mt-4 pt-2 border-t border-gray-200 w-full">
            <div className="text-xl flex justify-center">
              <div className="markdown-content text-left">
                <ReactMarkdown>{card.back}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-white mb-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                message.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
            placeholder="Type your message..."
            rows={1}
            disabled={chatMutation.isPending}
          />
          <button
            type="submit"
            className={`ml-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 ${
              chatMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <span className="animate-pulse">...</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleGenerateFlashcards}
            className="ml-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={chatMutation.isPending}
          >
            Generate Flashcards
          </button>
        </form>
      </div>
      {showModal && (
        <FlashcardReviewModal
          cards={generatedCards}
          currentIndex={currentCardIndex}
          onClose={() => setShowModal(false)}
          onAddToDeck={handleAddToDeck}
          onNext={handleNextCard}
          onPrevious={handlePreviousCard}
        />
      )}
    </div>
  );
};

export default ChatInterface;
