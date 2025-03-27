import { LuDatabaseZap as HeroIcon } from "react-icons/lu";

export default function HeroSection() {
    return (
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col gap-4 justify-center items-center text-center">
            <HeroIcon className="text-7xl text-gray-600" />
            <h1 className="text-2xl font-bold">
                FlockMTL Flow: Simplify Your DB Interaction ⚡️
            </h1>
            <p className="text-gray-500">
                Turn prompt into tables in seconds! 🚀 Run prompt, filter data, and inspect queries without complex coding. Just smooth, seamless DB interactions! 📊✨
            </p>
        </div>
    );
}