import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Topic from "../models/Topic.js";

// ตัวอย่าง 100 topics (ภาษาอังกฤษ) — หากต้องการภาษาไทย ให้แก้ข้อความที่นี่
const topics = [
  "Some people believe that university education is the only route to success.",
  "Governments should spend more on public transport than on roads.",
  "Do the benefits of advertising outweigh the harms?",
  "The impact of social media on young people.",
  "Parents should limit the amount of time children spend on electronic devices.",
  "The environmental impact of fast fashion.",
  "Should governments provide free healthcare for all?",
  "The effectiveness of online learning compared to face-to-face education.",
  "Is it better to live in the countryside than in the city?",
  "The role of technology in healthcare improvements.",
  "How to reduce traffic congestion in large cities?",
  "Is globalization good or bad for small businesses?",
  "The importance of preserving historical sites.",
  "Should children be required to learn a second language at school?",
  "The future of work: automation and employment.",
  "Are zoos ethical in modern society?",
  "Should countries invest more in renewable energy?",
  "The importance of mental health awareness.",
  "Is it better to take a gap year before university?",
  "How to tackle youth unemployment?",
  "Are online news sources reliable?",
  "Should smoking be banned in all public places?",
  "The role of sport in community development.",
  "Should genetic engineering in humans be allowed?",
  "How can governments reduce plastic pollution?",
  "The impact of tourism on local cultures.",
  "Is it important to teach financial literacy in schools?",
  "Should companies be required to offer remote work?",
  "The benefits and drawbacks of animal testing.",
  "How to promote equality in the workplace?",
  "Should governments limit immigration?",
  "The rise of e-commerce and its effects on retail stores.",
  "Should art and music be compulsory at school?",
  "How to encourage people to recycle more?",
  "The influence of celebrities on young people's behaviour.",
  "Is space exploration worth the cost?",
  "The role of the internet in education.",
  "How to reduce crime in urban areas?",
  "Should governments subsidize electric vehicles?",
  "The problem of obesity in modern society.",
  "How to improve public healthcare systems?",
  "Is homeschooling better than traditional schooling?",
  "Should public transport be free?",
  "The impact of mobile phones on society.",
  "How to support small farmers in developing countries?",
  "The ethics of capital punishment.",
  "Should there be a maximum salary?",
  "Is censorship ever justified?",
  "How to ensure clean water for all?",
  "Should children under 16 be allowed to use social media?",
  "The role of parents in children's education.",
  "Should the voting age be lowered?",
  "How to reduce greenhouse gas emissions?",
  "Is it important to protect endangered species?",
  "The effect of advertising on consumer behaviour.",
  "Should wealthy nations help poorer nations?",
  "How to promote reading among children?",
  "The benefits of bilingual education.",
  "Should plastic bags be banned?",
  "How to prevent teenage smoking?",
  "The future of public libraries in the digital age.",
  "Should schools adopt uniforms?",
  "How to encourage civic participation among young people?",
  "The importance of sleep for student performance.",
  "Should the government regulate junk food adverts?",
  "Is technology making people more isolated?",
  "How to reduce noise pollution in cities?",
  "Should university education be free?",
  "The influence of peer pressure on young people.",
  "How to improve road safety?",
  "Should we use nuclear energy?",
  "The role of volunteering in society.",
  "How to tackle homelessness?",
  "Should professional athletes be paid so highly?",
  "The impact of climate change on agriculture.",
  "How to improve maternal health worldwide?",
  "Should performance-enhancing drugs be legalized in sport?",
  "The role of parents vs teachers in discipline.",
  "How to reduce water waste in agriculture?",
  "Should art galleries be free to visitors?",
  "The future of newspapers in the internet era.",
  "How can cities become more bicycle friendly?",
  "Should public exams be abolished?",
  "The importance of early childhood education.",
  "How to reduce the gender pay gap?",
  "Should mobile phones be allowed in classrooms?",
  "The role of science in solving world problems.",
  "How to increase voter turnout?",
  "Should overtime work be limited by law?",
];

const run = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/essay_checker";
  await connectDB(MONGO_URI);
  try {
    await Topic.deleteMany({});
    await Topic.insertMany(topics.map((t) => ({ text: t })));
    console.log(`Inserted ${topics.length} topics`);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

run();
