import React, { useMemo } from 'react';

const allTopics = [
  'The process of photosynthesis in plants',
  'The history of the printing press',
  'How earthquakes are measured and predicted',
  'The life cycle of stars',
  'The invention and evolution of the bicycle',
  'The role of bees in pollination',
  'The history of writing systems',
  'How vaccines work',
  'The process of making chocolate from cacao beans',
  'The physics of roller coasters',
  'The life and works of Leonardo da Vinci',
  'How noise-cancelling headphones work',
  'The water cycle and its importance',
  'The history of timekeeping devices',
  'How 3D printing technology works',
  'The process of making paper from trees',
  'The life cycle of butterflies',
  'How solar panels convert sunlight into electricity',
  'The history of ice cream',
  'The science behind northern lights (aurora borealis)',
  'How telescopes work',
  'The process of recycling plastic',
  'The history of board games',
  'How touchscreens work',
  'The life cycle of frogs',
  'The process of making olive oil',
  'How refrigerators keep food cold',
  'The history of coffee cultivation',
  'The science of rainbows',
  'How airplanes achieve lift',
  'The process of making cheese',
  'The history of microscopes',
  'How plants communicate with each other',
  'The science behind soap and handwashing',
  'The process of silk production',
  'How GPS navigation works',
  'The history of toys',
  'The life cycle of salmon',
  'How wind turbines generate electricity',
  'The process of glassmaking',
  'The history of musical instruments',
  'How camera lenses work',
  'The science of baking bread',
  'The process of maple syrup production',
  'How elevators work',
  'The history of animation techniques',
  'The life cycle of coral reefs',
  'How noise pollution affects marine life',
  'The process of tea cultivation and production',
  'The science behind mirages',
  'How electric cars work',
  'The history of pottery and ceramics',
  'The process of honey production by bees',
  'How light bulbs work',
  'The science of composting',
  'The history of bridges and their design',
  'How plants adapt to desert environments',
  'The process of making ice cream',
  'How fireworks create different colors',
  'The history of calendars',
  'The science behind the formation of caves',
  'How the human eye perceives color',
  'The process of coffee roasting',
  'The history of kites',
  'How submarines dive and surface',
  'The science of snowflake formation',
  'The process of making tofu',
  'How hot air balloons work',
  'The history of mirrors',
  'The life cycle of sea turtles',
  'How holograms are created',
  'The process of making cotton fabric',
  'The science behind the formation of fossils',
  'How wireless charging works',
  'The history of jigsaw puzzles',
  'The process of making soy sauce',
  'How geothermal energy is harnessed',
  'The science of fermentation in food production',
  'The history of origami',
  'How noise barriers reduce sound pollution',
  'The process of making crayons',
  'The science behind the formation of pearls',
  'How electronic ink (e-ink) works',
  'The history of sundials',
  'The process of making rubber',
  'How plants respond to gravity',
  'The science of making perfumes and fragrances',
  'The history of mazes and labyrinths',
  'How seismographs detect earthquakes',
  'The process of making candles',
  'The science behind the formation of geodes',
  'How pneumatic tubes work',
  'The history of kaleidoscopes',
  'The process of making maple syrup',
  'How plants purify air indoors',
  'The science of making ice sculptures',
  'The history of snow globes',
  'How whales communicate underwater',
  'The process of making felt',
  'The science behind the formation of sand dunes',
  'How escalators work',
];
const getRandomTopics = (count: number) => {
  const shuffled = [...allTopics].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const TopicSuggestions: React.FC<{ onTopicClick: (topic: string) => void }> = ({ onTopicClick }) => {
  const randomTopics = useMemo(() => getRandomTopics(6), []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
      {randomTopics.map((topic, index) => (
        <button
          key={index}
          onClick={() => onTopicClick(topic)}
          className="p-2 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left text-xs sm:text-sm"
        >
          {topic}
        </button>
      ))}
    </div>
  );
};

export default TopicSuggestions;
