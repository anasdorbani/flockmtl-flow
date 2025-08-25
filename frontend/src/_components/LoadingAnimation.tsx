import React from "react";
import { motion } from "framer-motion";
import { Typography } from "antd";
import { HiSparkles } from "react-icons/hi2";
import { FiDatabase } from "react-icons/fi";

const { Title, Text } = Typography;

const LoadingAnimation: React.FC = () => {
    return (
        <div className="flex justify-center items-center min-h-[400px] w-full">
            <div
                className="relative bg-white border-2 border-gray-200 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl max-w-md w-full"
            >
                <div className="p-10 space-y-8 text-center">
                    {/* Animated Loading Icon */}
                    <motion.div
                        animate={{
                            opacity: [1, 0.3, 1],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="flex justify-center"
                    >
                        <HiSparkles className="text-6xl" style={{ color: '#FF9129' }} />
                    </motion.div>

                    {/* Loading Text */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FFE5CC' }}>
                                <FiDatabase className="text-sm" style={{ color: '#FF9129' }} />
                            </div>
                            <Title level={3} className="!mb-0 !text-gray-800">
                                Processing Query
                            </Title>
                        </div>

                        <Text className="text-gray-600 text-base">
                            Please wait while we analyze your data and generate results...
                        </Text>
                    </div>

                    {/* Animated Dots */}
                    <div className="flex justify-center space-x-1">
                        {[0, 1, 2].map((index) => (
                            <motion.div
                                key={index}
                                animate={{
                                    y: [-4, 4, -4],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: index * 0.2,
                                    ease: "easeInOut"
                                }}
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: '#FF9129' }}
                            />
                        ))}
                    </div>

                    {/* Subtle Progress Indication */}
                    <div className="pt-4 border-t border-gray-100">
                        <div
                            className="h-1 rounded-full overflow-hidden"
                            style={{ backgroundColor: '#FFE5CC' }}
                        >
                            <motion.div
                                className="h-full rounded-full w-1/3"
                                style={{
                                    background: 'linear-gradient(90deg, #FF9129 0%, #CC5500 100%)'
                                }}
                                animate={{
                                    x: ['-100%', '200%']
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingAnimation;
