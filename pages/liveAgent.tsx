import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import LoadingDots from '@/components/ui/LoadingDots';
import {
  AiOutlineSend,
} from 'react-icons/ai';
import { Document } from 'langchain/document';

const LiveAgent = () => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDocs, setSourceDocs] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [apiMessage, setApiMessage] = useState('');

  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('ENGLISH');
  const [id, setId] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState(0);
  const [hover, setHover] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showChatRating, setShowChatRating] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentInfoMsg, setAgentInfoMsg] = useState(false);
  const [agentImage, setAgentImage] = useState('/chat-header.png');
  const [timerRunning, setTimerRunning] = useState(false);




  useEffect(() => {
    // console.log("text there : ", checkNotSure)
  }, [ agentName, agentInfoMsg, agentImage]);





  useEffect(() => {
    const now = Date.now();
    const newId = now.toString();
    setId('Live' + newId);
  }, []);
  console.log('user id : ', id);






  useEffect(() => {
    console.log("----------", id)
    let intervalId: any;
    if (timerRunning) {
      intervalId = setInterval(async () => {
        const response = await fetch('http://localhost:5000/live-chat-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId: id }),
        });

        if (response.status !== 200) {
          const error = await response.json();
          throw new Error(error.message);
        }
        const data = await response.json();
        console.log('live chat agent : ', data.agent_id);
        console.log('live chat status : ', data.chat_status);
        console.log('live chat message : ', data.agent_message);

        if (data.chat_status === "closed") {
          setShowChatRating(true);
        }
        else {
          setShowChatRating(false);
          setAgentInfoMsg(false);
          if (data.agent_id != "unassigned") {
            if (!data.profile_picture) {
              setAgentImage("/chat-header.png");
            }
            else {
              setAgentImage("http://localhost:5000/uploads/" + data.profile_picture);
            }
            setAgentName(data.agent_name);

            setAgentInfoMsg(true);
            if (data.agent_message != null) {
              setMessageState((state) => ({
                ...state,
                messages: [
                  ...state.messages,
                  {
                    type: 'apiMessage',
                    message: data.agent_message,
                  },
                ],
                pending: undefined,
              }));
            }
          }
        }
        }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [timerRunning, id]);

//   useEffect(()=>{
//     if(timerRunning){
//       console.log("thinushika")
//     }
//   },[])
//   const handleSubmitOne = ()=>{
//     console.log('=== button clicked ====')
//     setTimerRunning(true)
// };

  useEffect(() => {
    console.log(selectedLanguage);
    console.log('useEffect : ', apiMessage);
  }, [selectedLanguage, apiMessage]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }
    // get user message
    let question = query.trim();
    console.log('question from user : ', question);

    // set user message array
    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'apiMessage',
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setQuery('');
    setMessageState((state) => ({ ...state, pending: '' }));

    // send user message
    const response = await fetch('http://localhost:5000/live-chat-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_Message: question,
        language: selectedLanguage,
        chatId: id,
      }),
    });

    if (response.status !== 200) {
      const error = await response.json();
      throw new Error(error.message);
    }
    const data = await response.json();
    if(data.success === "Added"){
      setTimerRunning(true);
      setLoading(false);
      setShowAlert(true);
    }
    else{
      console.log('response : ', 'Insert Fail');
    }

    const ctrl = new AbortController();
  }

  //prevent empty submissions
  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && query) {
        handleSubmit(e);
      } else if (e.key == 'Enter') {
        e.preventDefault();
      }
    },
    [query],
  );

 

  const chatMessages = useMemo(() => {
    return messages.filter(
      (message) =>
        message.type === 'userMessage' || message.message !== undefined,
    );
  }, [messages]);

  console.log('messages : ', messages);






  //scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  async function sendRateValues() {
    // const sendData = async (botName, index) => {
    try {
      const response = await fetch('http://localhost:5000/save-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: id,
          ratingValue: rating,
          feedbakMessage: inputValue,
        }),
      });
      const ratingData = await response.json();
      // console.log(ratingData)
    } catch (error) {
      console.error(error);
    }
    // }
    // console.log(inputValue);
    // console.log(rating);
  }

  return (
    <Layout>
      {/* chat top header */}
      <div className={`${styles.chatTopBar} d-flex flex-row`}>
        <div className="col-12 text-center d-flex flex-row justify-content-between px-2">
          <Image src="/chat-top-bar.png" alt="AI" width={150} height={30} />
        </div>
      </div>




      <div className={`${styles.messageWrapper}`}>
        <div
          className={`${styles.botChatMsgContainer} d-flex flex-column my-2`}
        >
          <div className="d-flex">
            <Image
              src="/chat-header.png"
              alt="AI"
              width="40"
              height="40"
            /></div>
          <div className={`d-flex flex-column py-3 `}>
            <div
              className={`welcomeMessageContainer d-flex flex-column align-items-center`}
            >
              <Image
                src="/language-img.png"
                alt="AI"
                width={220}
                height={150}
              />
              <p className="mt-2">Hello, Welcome to DFCC Bank. Please select the language to get started.</p>
              <p className="">ආයුබෝවන්, DFCC බැංකුවට සාදරයෙන් පිළිගනිමු. ඔබේ ප්‍රශ්නවලට පිළිතුරු සැපයීම සඳහා කරුණාකර භාෂාව තෝරන්න.</p>
              <p className="">வணக்கம், DFCC வங்கிக்கு உங்களை வரவேற்கிறோம். தொடர்வதற்கு, விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்</p>

              <div className="d-flex flex-row welcome-language-select">
                <div className="col-4 p-1">
                  <button className=' px-3 py-2 rounded' onClick={() => {
                    setSelectedLanguage('ENGLISH');
                    setMessageState((state) => ({
                      ...state,
                      messages: [
                        ...state.messages,
                        {
                          type: 'apiMessage',
                          message: 'English',
                        },
                      ],
                      pending: undefined,
                    }));
                  }}>English</button>
                </div>
                <div className="col-4 p-1">
                  <button className='px-3 py-2 rounded' onClick={() => {
                    setSelectedLanguage('SINHALA');
                    setMessageState((state) => ({
                      ...state,
                      messages: [
                        ...state.messages,
                        {
                          type: 'apiMessage',
                          message: 'Sinhala',
                        },
                      ],
                      pending: undefined,
                    }));
                  }}>Sinhala</button>
                </div>

                <div className="col-4 p-1">
                  <button className='px-3 py-2 rounded' onClick={() => {
                    setSelectedLanguage('TAMIL');
                    setMessageState((state) => ({
                      ...state,
                      messages: [
                        ...state.messages,
                        {
                          type: 'apiMessage',
                          message: 'Tamil',
                        },
                      ],
                      pending: undefined,
                    }));
                  }}>Tamil</button>
                </div>

              </div>
            </div>
            {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
          </div>
        </div>

        {
            agentInfoMsg && (
              <div className="alert alert-info mx-3 text-center  alert-dismissible fade show" role="alert">
                Now you are chatting with {agentName}
                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            )
          }
        <div
          ref={messageListRef}
          className={`${styles.messageContentWrapper} d-flex flex-column`}
        >
          {chatMessages.map((message, index) => {
            let icon;
            let className;
            let userHomeStyles;
            let wrapper = 'align-items-end justify-content-end';
            let userStyles = 'justify-content-end flex-row-reverse float-end';
            if (message.type === 'apiMessage') {
              icon = (
                <Image
                  src="/chat-header.png"
                  alt="AI"
                  width="40"
                  height="40"
                  className={styles.botImage}
                  priority
                />
              );
              className = styles.apimessage;
              userStyles = 'justify-content-start flex-row float-start';
              wrapper = 'align-items-start justify-content-start';

            } else {
              icon = (
                <Image
                  src="/user.png"
                  alt="Me"
                  width="40"
                  height="40"
                  className={styles.botImage}
                  priority
                />
              );
              userHomeStyles = styles.userApiStyles;
              // The latest message sent by the user will be animated while waiting for a response
              className =
                loading && index === chatMessages.length - 1
                  ? styles.usermessagewaiting
                  : styles.usermessage;
            }
            return (
              <>
                <div
                  key={`chatMessage-${index}`}
                  className={styles.botMessageContainerWrapper}
                >
                  <div
                    className={`${styles.botChatMsgContainer} ${userStyles} d-flex my-2`}
                  >
                    <div className="d-flex">{icon}</div>
                    <div className={`${wrapper} d-flex flex-column ms-2`}>
                      <div
                        className={`${styles.botMessageContainer} ${userHomeStyles} d-flex flex-column my-1`}
                      >
                        <p className="mb-0">{message.message}</p>
                      </div>
                      {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
                    </div>
                  </div>
                </div>
              </>
            );
          })}
          {showChatRating && (
            <div className="d-flex flex-column" id='chatRating'>
              <div className="d-flex">
                <Image src="/chat-header.png" alt="AI" width="40" height="40" />
              </div>
              <div className={`d-flex flex-column px-1 py-2`}>
                <div
                  className={`welcomeMessageContainer d-flex flex-column align-items-center`}
                >
                  <div className="container-fluid m-0 p-0">
                    <div
                      className={`${styles.botRateRequest} d-flex flex-row my-2 mx-2`}
                    >
                      <div
                        className={`${styles.botRatingContainer} d-flex flex-column my-1`}
                      >
                        <p className={`${styles.rateTitle} mb-0 text-dark`}>
                          Rate your conversation
                        </p>
                        <p className="text-dark mb-0">Add your rating</p>
                        <div className="star-rating">
                          {[...Array(5)].map((star, index) => {
                            index += 1;
                            return (
                              <button
                                type="button"
                                key={index}
                                className={
                                  index <= (hover || rating) ? 'on' : 'off'
                                }
                                onClick={() => {
                                  setRating(index);
                                }}
                                onMouseEnter={() => setHover(index)}
                                onMouseLeave={() => setHover(rating)}
                              >
                                <span className="star">&#9733;</span>
                              </button>
                            );
                          })}
                        </div>
                        <p className={` mb-0 mt-3 text-dark`}>Your feedback :</p>
                        <textarea
                          className={`${styles.textarea} p-2 rounded`}
                          rows={3}
                          maxLength={512}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />

                        <button
                          onClick={sendRateValues}
                          className="text-white bg-dark p-2 mt-2 rounded"
                        >
                          SEND
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
              </div>
            </div>
          )
          }
        </div>
      </div>

      {/* input fields =================*/}
      <div className={`${styles.inputContainer}`}>
        {/* <form onSubmit={handleSubmit}> */}
        <textarea
          disabled={loading}
          onKeyDown={handleEnter}
          ref={textAreaRef}
          autoFocus={false}
          rows={1}
          maxLength={512}
          id="userInput"
          name="userInput"
          placeholder={
            loading
              ? 'Waiting for response...'
              : 'What is this question about?'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.textarea}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`${styles.inputIconContainer} `}
        >
          {loading ? (
            <div className={styles.loadingwheel}>
              <LoadingDots color="#fff" />
              {/* <LoadingIcons.ThreeDots /> */}
            </div>
          ) : (
            // Send icon SVG in input field
            <AiOutlineSend className={styles.sendIcon} />
          )}
        </button>
        {/* </form> */}
      </div>
      {error && (
        <div className="border border-red-400 rounded-md p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      {/* input fields ================= */}
    </Layout>
  );
};

export default LiveAgent;
