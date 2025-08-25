import { LuDatabaseZap as HeroIcon } from "react-icons/lu";
import { Card, Typography, Space } from "antd";

const { Title, Paragraph } = Typography;

export default function HeroSection() {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card
                className="flock-card bg-gradient-flock-orange-to-red overflow-hidden"
                styles={{
                    body: { padding: '48px 32px' }
                }}
            >
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-flock-orange-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                        <HeroIcon className="relative text-8xl text-flock-orange mx-auto drop-shadow-sm" />
                    </div>

                    <Space direction="vertical" size="large" className="w-full">
                        <Title level={1} className="!mb-0 !text-2xl md:!text-3xl lg:!text-4xl font-bold text-gradient-flock-orange">
                            FlockMTL Flow
                        </Title>

                        <Title level={3} className="!mb-0 !text-lg md:!text-xl text-gray-700 font-medium">
                            Simplify Your Database Interactions ⚡️
                        </Title>

                        <Paragraph className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Transform natural language prompts into database queries in seconds! 🚀
                            <br />
                            Run queries, analyze results, and inspect execution plans without complex coding.
                            <br />
                            <span className="font-semibold text-flock-orange">Just smooth, seamless database interactions! 📊✨</span>
                        </Paragraph>
                    </Space>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-sm">
                        <div
                            className="bg-white/60 backdrop-blur-sm p-4"
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--border-radius)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div className="text-2xl mb-2">🤖</div>
                            <div className="font-semibold text-gray-800">AI-Powered Queries</div>
                            <div className="text-gray-600">Natural language to SQL</div>
                        </div>
                        <div
                            className="bg-white/60 backdrop-blur-sm p-4"
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--border-radius)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div className="text-2xl mb-2">⚡️</div>
                            <div className="font-semibold text-gray-800">Fast</div>
                            <div className="text-gray-600">Instant query execution</div>
                        </div>
                        <div
                            className="bg-white/60 backdrop-blur-sm p-4"
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--border-radius)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div className="text-2xl mb-2">🔍</div>
                            <div className="font-semibold text-gray-800">Query Inspector</div>
                            <div className="text-gray-600">Visualize execution plans</div>
                        </div>
                    </div>

                    <div
                        className="mt-8 p-4 bg-flock-orange-50"
                        style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div className="text-sm text-flock-orange-dark font-medium">
                            👇 Start by selecting one or more tables below to begin querying your data
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}