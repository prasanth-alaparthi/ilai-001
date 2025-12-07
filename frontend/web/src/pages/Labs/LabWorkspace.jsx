import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SimulationFrame from '../../components/labs/SimulationFrame';
import CodeEditor from '../../components/labs/CodeEditor';
import QuizComponent from '../../components/labs/QuizComponent';
import AiSolver from '../../components/labs/AiSolver';
import { BookOpenIcon, BeakerIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const LabWorkspace = () => {
    const { id } = useParams();
    const [lab, setLab] = useState(null);
    const [activeTab, setActiveTab] = useState('guide'); // guide, quiz, ai
    const [code, setCode] = useState('');

    useEffect(() => {
        // Mock fetch
        // fetch(`/api/labs/${id}`)
        const mockLab = {
            id: id,
            title: id === '1' ? 'Solar System Simulation' : id === '3' ? 'Intro to Python' : 'Lab Session',
            description: 'Follow the instructions to complete the lab.',
            category: id === '3' ? 'CS' : 'PHYSICS',
            content: id === '1' ? 'SolarSystem' : id === '3' ? "print('Hello World')" : 'Titration',
            quiz: {
                title: 'Post-Lab Quiz',
                questions: [
                    { id: 1, questionText: 'Test Question?', options: ['A', 'B'], correctAnswer: 'A', explanation: 'Because A.' }
                ]
            }
        };
        setLab(mockLab);
        if (mockLab.category === 'CS') {
            setCode(mockLab.content);
        }
    }, [id]);

    if (!lab) return <div className="p-8 text-center">Loading Lab...</div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6">
            {/* Left Panel: Workspace (Simulation or Code) */}
            <div className="flex-1 flex flex-col min-h-[400px]">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-t-2xl border border-gray-200 dark:border-gray-700 border-b-0 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center">
                        {lab.category === 'CS' ? <CpuChipIcon className="w-5 h-5 mr-2" /> : <BeakerIcon className="w-5 h-5 mr-2" />}
                        {lab.title}
                    </h2>
                    {lab.category === 'CS' && (
                        <button className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                            Run Code
                        </button>
                    )}
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-b-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {lab.category === 'CS' ? (
                        <CodeEditor code={code} onChange={setCode} language="python" />
                    ) : (
                        <SimulationFrame type={lab.content} />
                    )}
                </div>
            </div>

            {/* Right Panel: Instructions / Quiz / AI */}
            <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('guide')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'guide' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Guide
                    </button>
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'quiz' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Quiz
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ai' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        AI Help
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'guide' && (
                        <div className="prose dark:prose-invert text-sm">
                            <h3>Instructions</h3>
                            <p>{lab.description}</p>
                            <h4>Steps:</h4>
                            <ol>
                                <li>Read the objective.</li>
                                <li>Interact with the workspace.</li>
                                <li>Observe the results.</li>
                                <li>Take the quiz to verify understanding.</li>
                            </ol>
                        </div>
                    )}

                    {activeTab === 'quiz' && (
                        <QuizComponent quiz={lab.quiz} />
                    )}

                    {activeTab === 'ai' && (
                        <AiSolver type={lab.category === 'CS' ? 'code' : 'science'} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabWorkspace;
