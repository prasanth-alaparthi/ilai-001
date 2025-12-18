/**
 * ILAI Professional Labs - Literature Lab (PhD Level)
 * 
 * Literary analysis and writing tools:
 * - Poetry analysis
 * - Literary devices detector
 * - Character analysis
 * - Theme explorer
 * - Writing prompts
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Feather, Sparkles, Search, Quote, Hash,
    Users, Palette, Target, ChevronRight, RefreshCw, Copy
} from 'lucide-react';

// Literary devices
const LITERARY_DEVICES = [
    { name: 'Metaphor', definition: 'A figure of speech that describes an object or action in a way that is not literally true.', example: '"Life is a journey."' },
    { name: 'Simile', definition: 'A comparison using "like" or "as".', example: '"Her smile was like sunshine."' },
    { name: 'Personification', definition: 'Giving human characteristics to non-human things.', example: '"The wind whispered through the trees."' },
    { name: 'Alliteration', definition: 'Repetition of the same consonant sounds at the beginning of words.', example: '"Peter Piper picked a peck of pickled peppers."' },
    { name: 'Hyperbole', definition: 'Exaggerated statements not meant to be taken literally.', example: '"I\'ve told you a million times."' },
    { name: 'Onomatopoeia', definition: 'Words that imitate sounds.', example: '"The bees buzzed in the garden."' },
    { name: 'Irony', definition: 'Expression of meaning using language that normally signifies the opposite.', example: '"How nice!" (when something bad happens)' },
    { name: 'Foreshadowing', definition: 'Hints about what will happen later in the story.', example: 'Dark clouds gathering before a tragedy' },
    { name: 'Symbolism', definition: 'Use of symbols to represent ideas or qualities.', example: 'A dove representing peace' },
    { name: 'Imagery', definition: 'Visually descriptive language that appeals to the senses.', example: '"The golden sun melted into the crimson horizon."' }
];

// Famous poems for analysis
const POEMS = [
    {
        title: 'The Road Not Taken',
        author: 'Robert Frost',
        year: 1916,
        text: `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`,
        themes: ['Choice', 'Individualism', 'Regret', 'Life Journey'],
        devices: ['Metaphor', 'Symbolism', 'Imagery']
    },
    {
        title: 'Sonnet 18',
        author: 'William Shakespeare',
        year: 1609,
        text: `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date;

Sometime too hot the eye of heaven shines,
And often is his gold complexion dimm'd;
And every fair from fair sometime declines,
By chance or nature's changing course untrimm'd;

But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st;
Nor shall death brag thou wander'st in his shade,
When in eternal lines to time thou grow'st:

So long as men can breathe or eyes can see,
So long lives this, and this gives life to thee.`,
        themes: ['Love', 'Beauty', 'Immortality', 'Time'],
        devices: ['Metaphor', 'Personification', 'Imagery', 'Rhyme']
    },
    {
        title: 'Still I Rise',
        author: 'Maya Angelou',
        year: 1978,
        text: `You may write me down in history
With your bitter, twisted lies,
You may trod me in the very dirt
But still, like dust, I'll rise.

Does my sassiness upset you?
Why are you beset with gloom?
'Cause I walk like I've got oil wells
Pumping in my living room.

Just like moons and like suns,
With the certainty of tides,
Just like hopes springing high,
Still I'll rise.`,
        themes: ['Resilience', 'Self-worth', 'Overcoming Adversity', 'Pride'],
        devices: ['Simile', 'Metaphor', 'Repetition', 'Imagery']
    }
];

// Writing prompts
const WRITING_PROMPTS = [
    { type: 'Creative', prompt: 'Write about a door that opens to a different place each time.' },
    { type: 'Character', prompt: 'Describe a protagonist who discovers they have been living someone else\'s life.' },
    { type: 'Setting', prompt: 'Create a world where colors have sounds and sounds have textures.' },
    { type: 'Conflict', prompt: 'Two best friends realize they are competing for the same dream.' },
    { type: 'Theme', prompt: 'Explore the idea of "home" for someone who has never had one.' },
    { type: 'Dialogue', prompt: 'Write a conversation between past and future versions of yourself.' },
    { type: 'Poetry', prompt: 'Compose a poem about the space between heartbeats.' },
    { type: 'Flash Fiction', prompt: 'Tell a complete story in exactly 50 words.' }
];

// Famous authors
const AUTHORS = [
    { name: 'William Shakespeare', era: 'Renaissance', works: 'Hamlet, Romeo and Juliet, Macbeth', style: 'Dramatic verse, sonnets' },
    { name: 'Jane Austen', era: '19th Century', works: 'Pride and Prejudice, Emma, Sense and Sensibility', style: 'Social satire, wit' },
    { name: 'Charles Dickens', era: 'Victorian', works: 'Oliver Twist, Great Expectations, A Tale of Two Cities', style: 'Social commentary, serialized novels' },
    { name: 'Virginia Woolf', era: 'Modernist', works: 'Mrs Dalloway, To the Lighthouse, Orlando', style: 'Stream of consciousness' },
    { name: 'Gabriel García Márquez', era: '20th Century', works: 'One Hundred Years of Solitude, Love in the Time of Cholera', style: 'Magical realism' },
    { name: 'Toni Morrison', era: 'Contemporary', works: 'Beloved, Song of Solomon, The Bluest Eye', style: 'African American experience, lyrical prose' }
];

const LiteratureLab = () => {
    const [activeTab, setActiveTab] = useState('poems');
    const [selectedPoem, setSelectedPoem] = useState(POEMS[0]);
    const [searchDevice, setSearchDevice] = useState('');
    const [randomPrompt, setRandomPrompt] = useState(WRITING_PROMPTS[0]);
    const [copied, setCopied] = useState(false);

    const filteredDevices = searchDevice
        ? LITERARY_DEVICES.filter(d =>
            d.name.toLowerCase().includes(searchDevice.toLowerCase()) ||
            d.definition.toLowerCase().includes(searchDevice.toLowerCase())
        )
        : LITERARY_DEVICES;

    const getNewPrompt = () => {
        const idx = Math.floor(Math.random() * WRITING_PROMPTS.length);
        setRandomPrompt(WRITING_PROMPTS[idx]);
    };

    const copyPrompt = () => {
        navigator.clipboard.writeText(randomPrompt.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                            <BookOpen size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Literature Lab</h1>
                            <p className="text-sm text-gray-500">Explore Literary Arts</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['poems', 'devices', 'authors', 'writing'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-pink-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Poems Tab */}
                {activeTab === 'poems' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Poem Selector */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-400">Select Poem</h3>
                            {POEMS.map((poem, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedPoem(poem)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${selectedPoem === poem
                                            ? 'bg-pink-600/10 border-pink-500'
                                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                                        }`}
                                >
                                    <div className="font-medium text-white">{poem.title}</div>
                                    <div className="text-sm text-gray-500">{poem.author} ({poem.year})</div>
                                </button>
                            ))}
                        </div>

                        {/* Poem Text */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-medium text-white mb-2">{selectedPoem.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">by {selectedPoem.author}</p>
                            <div className="font-serif text-gray-300 whitespace-pre-line leading-relaxed">
                                {selectedPoem.text}
                            </div>
                        </div>

                        {/* Analysis */}
                        <div className="space-y-4">
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                    <Target size={16} className="text-pink-400" /> Themes
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPoem.themes.map((theme, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm">
                                            {theme}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                    <Sparkles size={16} className="text-purple-400" /> Literary Devices
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPoem.devices.map((device, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                                            {device}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Literary Devices Tab */}
                {activeTab === 'devices' && (
                    <div className="space-y-6">
                        <div className="relative max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchDevice}
                                onChange={(e) => setSearchDevice(e.target.value)}
                                placeholder="Search devices..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDevices.map((device, idx) => (
                                <motion.div
                                    key={device.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-gray-900 rounded-xl border border-gray-800 p-4"
                                >
                                    <h3 className="font-medium text-white mb-2">{device.name}</h3>
                                    <p className="text-sm text-gray-400 mb-3">{device.definition}</p>
                                    <div className="bg-gray-800 rounded-lg p-3 flex items-start gap-2">
                                        <Quote size={14} className="text-pink-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm italic text-gray-300">{device.example}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Authors Tab */}
                {activeTab === 'authors' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {AUTHORS.map((author, idx) => (
                            <motion.div
                                key={author.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-pink-500/20 rounded-lg">
                                        <Feather size={20} className="text-pink-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{author.name}</h3>
                                        <p className="text-xs text-gray-500">{author.era}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Notable Works: </span>
                                        <span className="text-gray-300">{author.works}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Style: </span>
                                        <span className="text-gray-300">{author.style}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Writing Tab */}
                {activeTab === 'writing' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-white">Writing Prompt</h3>
                                <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm">
                                    {randomPrompt.type}
                                </span>
                            </div>

                            <p className="text-xl text-gray-200 leading-relaxed mb-8">
                                "{randomPrompt.prompt}"
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={getNewPrompt}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 hover:bg-pink-500 rounded-xl text-white font-medium"
                                >
                                    <RefreshCw size={18} /> New Prompt
                                </button>
                                <button
                                    onClick={copyPrompt}
                                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl"
                                >
                                    {copied ? '✓ Copied' : <Copy size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {WRITING_PROMPTS.slice(0, 4).map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setRandomPrompt(p)}
                                    className={`p-3 rounded-lg text-sm text-left transition-all ${randomPrompt === p
                                            ? 'bg-pink-600/20 border border-pink-500'
                                            : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    {p.type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiteratureLab;
