import { LuDatabaseZap as HeroIcon } from "react-icons/lu";

export default function HeroSection() {
    return (
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col gap-4 justify-center items-center text-center">
            <HeroIcon className="text-7xl text-gray-600" />
            <h1 className="text-2xl font-bold">
                Query-to-Pipeline: Simplify Your Data Workflows ⚡️
            </h1>
            <p className="text-gray-500">
                Turn queries into pipelines in seconds! 🚀 Run queries, filter data, and streamline workflows—all without complex coding. Just smooth, seamless table interactions! 📊✨
            </p>
        </div>
    );
}