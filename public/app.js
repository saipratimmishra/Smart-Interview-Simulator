const socket = io();
console.log("JS CONNECTED ");
let time=document.getElementById("timer")
const startBtn = document.getElementById("startBtn");
const sendBtn = document.getElementById("sendBtn");
const endBtn = document.getElementById("endBtn");
const rstBtn = document.getElementById("rstBtn");
const voiceBtn = document.getElementById("voiceBtn");
const question=document.getElementById("question")
const questionBox = document.getElementById("questionBox");
const chatArea = document.getElementById("chatArea");
const answerInput = document.getElementById("answerInput");
const aiThinking = document.getElementById("aiThinking");
const feedback_main=document.getElementById("feedback-main");
const main=document.getElementById("main");
let mode;

document.getElementById("sendBtn").disabled = true;
let timer = 0;
let timerInterval = null; 
function formatTime(sec){
    let min = Math.floor(sec / 60);
    let s = sec % 60;
    return `${min<10?'0'+min:min}:${s<10?'0'+s:s}`;
}

function startTimer(){
    if(timerInterval) clearInterval(timerInterval);
    startBtn.style="display:none;"
    questionBox.style="display:none;"
    aiThinking.style="display:block;"
    document.getElementById("sendBtn").disabled = false;
    timerInterval = setInterval(()=>{
        timer++;
        time.innerText = formatTime(timer);
    },1000);
}

function addMessageans(text,type){
    const div=document.createElement("div");
    div.className="message user";
    div.innerText=text;
    chatArea.appendChild(div);
    feedback_main.scrollTop = feedback_main.scrollHeight;
}
function addMessage(data){
    const div=document.createElement("div");
    div.className="message ai";
    div.innerText=data;
    feedback_main.appendChild(div);
    feedback_main.scrollTop=chatArea.scrollHeight;
    feedback_main.style="display:block"
}
function addMessageques(text,type){
    const div=document.createElement("div");
    div.className="message ai";
    div.innerText=text;
    question.appendChild(div);
    question.scrollTop=chatArea.scrollHeight;
    question.style="display:block"
}

startBtn.onclick=()=>{
    question.innerHTML=""
    endBtn.style="display:block"
    const role = document.getElementById("role").value;
    mode= document.getElementById("mode").value;
    const difficulty = document.getElementById("difficulty").value;
    console.log(role,difficulty)
    socket.emit("startInterview", {
       role: role,
       difficulty: difficulty,
       mode: mode
    });
    startTimer();
};

endBtn.onclick=()=>{
    endBtn.style="display:none"
    clearInterval(timerInterval);
    main.style="display:none"
    feedback_main.style="display:block"
    rstBtn.style="display:block"
    socket.emit("feedback");
}

rstBtn.onclick=()=>{
     document.getElementById("sendBtn").disabled = true;
     startBtn.style="display:block"
     main.style="display:flex"
     feedback_main.style="display:none"
     feedback_main.innerHTML=""
     rstBtn.style="display:none"
     question.innerHTML = "";
     question.innerText="Please Press Start Interview";
     question.style="height:30px"
     chatArea.innerHTML = "";
     timer=0;
     time.innerText = "00:00";
}

socket.on("question",(data)=>{
    aiThinking.style.display="none";
    questionBox.innerText=data;
    addMessageques("AI: "+data,"ai");
});

socket.on("answer",(data)=>{
    aiThinking.style.display="none";
    questionBox.innerText=data;
    addMessageans("AI: "+data,"ai");
});

sendBtn.onclick=()=>{
    const answer=answerInput.value;
    if(!answer || answer.trim()=="") return;
    addMessageans("You: "+answer,"user");
    socket.emit("Answer",answer);
    answerInput.value="";
    aiThinking.style.display="block";
    
};

socket.on("feedback",(data)=>{
    addMessage("Feedback: "+data,"ai");
});


voiceBtn.onclick=()=>{

    const recognition=new webkitSpeechRecognition();
    recognition.start();
    recognition.onresult=(event)=>{
        answerInput.value=event.results[0][0].transcript;
    };
};
