const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
let questions = [];
const Groq = require("groq-sdk");

let question=undefined;
let quesanswer=undefined;
let sub;
let diff;
const client = new Groq({
   apiKey: process.env.GROQ_API_KEY
});
app.use(express.static("public"));

io.on("connection", (socket) => {
    async function generateQuestion(socket, subject){
        console.log(subject)
        difficulty=subject.difficulty
        mode=subject.mode
        subject=subject.role
        
        console.log(subject,difficulty,mode)
        try{
        const chatCompletion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `
                    You are a senior technical interviewer.
                    Subject interpretation rules:

                    - If subject is "frontend":
                    - web frontend development (HTML, CSS, JavaScript, DOM, React concepts, browser behavior).

                    - If subject is "backend":
                    - server-side development (Node.js, APIs, databases, authentication, system design).

                    - If subject is "java":
                    - Java programming language, OOP, collections, multithreading, JVM concepts.

                    - If subject is "python":
                    - Python programming, data structures, functions, async, libraries.

                    - If subject is "anatomy":
                    - HUMAN ANATOMY (biology/medical), organs, body systems, physiology.

                    Rules:
                    - Ask ONE question only not more than 2 sentence.
                    - Do not repeat previous questions.
                    - Do not give answer
                    `
                },
                {
                    role: "user",
                    content: `Ask a ${difficulty} ${subject} interview question of type ${mode}.
                            Avoid questions from this as well as related to this: ${JSON.stringify(questions)}`
                }
            ]
        });
        let bot_reply = chatCompletion.choices[0].message.content;
        question = bot_reply;
        socket.emit("question", bot_reply);
        }
        catch(exception){
            console.log(exception)
        }
    }

    console.log("User connected ");
    socket.on("startInterview",async (subject,difficulty,mode)=>{
        questions=[]
        sub=subject
        diff=difficulty
        mod=mode
        await generateQuestion(socket, subject, difficulty, mode);
    })

    socket.on("Answer",async (answer)=>{
        quesanswer=answer
        questions.push({question:question, answer:quesanswer})
        await generateQuestion(socket, sub, diff);
        console.log(questions)
    });
    
    socket.on("feedback",async ()=>{
        
        const chatCompletion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a senior technical interviewer evaluating candidate answers.
                        Subject interpretation rules:

                        - frontend : HTML, CSS, JavaScript, DOM, browser concepts
                        - backend : APIs, databases, server architecture
                        - java : Java language, OOP, JVM
                        - python : Python programming
                        - anatomy : HUMAN ANATOMY (medical/biology)

                        Evaluation Rules:
                        - Be honest and professional.
                        - Give constructive feedback.
                        - Mention strengths.
                        - Mention mistakes or missing concepts.
                        - Suggest improvements.
                        - DO NOT generate new questions.
                        - Keep feedback concise and clear.
                        - If no interview history is provided, respond ONLY with: "No interview answers available for evaluation."
                        - Do not add any extra text or explanation in this case.

                        Strengths:(be strict, mention "NONE" if it is not there or answer is irrelivant)
                        Weaknesses:(if question is of type mcq mention what type of question is weakness of the candidate)
                        Improvements:
                        Overall rating (1-10):(if question is of type mcq rate out of total question answered correct/total question asked)
                    `
                },
                {
                    role: "user",
                    content: `Evaluate candidate answers based on the following interview history: ${JSON.stringify(questions,null,2)}`
                }
            ]
        });
        let bot_reply = chatCompletion.choices[0].message.content;
        console.log(bot_reply)
        socket.emit("feedback",bot_reply)
    })

})


server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
