import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiDatabase } from "react-icons/fi";
import { IoExpand } from "react-icons/io5";
import { FaMagnifyingGlassChart } from "react-icons/fa6";
import { MdOutlineInsights } from "react-icons/md";
import { HiOutlineFilter } from "react-icons/hi";

const steps = [
    { icon: <FiDatabase className="text-gray-300 text-5xl" />, text: "Loading Data" },
    { icon: <IoExpand className="text-gray-300 text-5xl" />, text: "Expanding Prompts" },
    { icon: <HiOutlineFilter className="text-gray-300 text-5xl" />, text: "Filtering Data" },
    { icon: <FaMagnifyingGlassChart className="text-gray-300 text-5xl" />, text: "Extracting Insights" },
    { icon: <MdOutlineInsights className="text-gray-300 text-5xl" />, text: "Generating Final Results" },
];

const stepVariants = {
    visible: { opacity: [0, 1, 0], scale: [0.8, 1, 0.8], y: [40, 0, -40], transition: { duration: 1.5 } },
    hidden: { opacity: 0, scale: 0.8, y: 10 },
};

const LoadingAnimation: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 1500); // Each step lasts 1.5 seconds before switching

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-16">
            <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex flex-col items-center text-center"
            >
                {steps[currentStep].icon}
                <span className="text-lg text-gray-300 mt-2 font-bold">{steps[currentStep].text}</span>
            </motion.div>
            <h2 className="text-2xl text-gray-500 font-bold animate-pulse">Processing Your Prompt ⚡️</h2>
        </div>
    );
};

export default LoadingAnimation;
