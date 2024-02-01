import { useEffect, useState } from 'react';
import { GptMessage, MyMessage, TypingLoader, TextMessageBox } from '../../components';
import { createThreadUseCase } from '../../../core/use-cases';
import { postQuestionUseCase } from '../../../core/use-cases/assistant/post-question.use-case';

interface Message {
  text: string;
  isGpt: boolean;
}

export const AssistantPage = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([])

  const [threadId, setThreadId] = useState<string>()

  useEffect(() => {
    const threadId = localStorage.getItem('threadId')

    if (threadId) setThreadId(threadId)
    else {
      createThreadUseCase()
        .then((id) => {
          setThreadId(id)
          localStorage.setItem('threadId', id)
        })
    }
  }, [])

  useEffect(() => {
    if(threadId) {
      setMessages((prev) => [
        ...prev,
        {
          text: `Número de thread ${threadId}`,
          isGpt: true
        }
      ])
    }
  }, [threadId])
  

  const handlePost = async( text: string ) => {

    if(!threadId) return

    setIsLoading(true);
    setMessages( (prev) => [...prev, { text: text, isGpt: false }] );

    //TODO: UseCase
    const replies = await postQuestionUseCase(threadId, text)
    
    setIsLoading(false);

    for(const reply of replies) {
      for (const message of reply.content) {
        setMessages((prev) => [
          ...prev,
          {
            text: message, 
            isGpt: reply.role === 'assistant',
            info: reply
          }
        ])
      }
    }

    // Todo: Añadir el mensaje de isGPT en true

  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        <div className="grid grid-cols-12 gap-y-2">
          {/* Bienvenida */}
          <GptMessage text="Buen día, soy Aless, en qué puedo ayudarte?" />

          {
            messages.map( (message, index) => (
              message.isGpt
                ? (
                  <GptMessage key={ index } text={ message.text } />
                )
                : (
                  <MyMessage key={ index } text={ message.text } />
                )
                
            ))
          }

          
          {
            isLoading && (
              <div className="col-start-1 col-end-12 fade-in">
                <TypingLoader />
              </div>
            )
          }
          

        </div>
      </div>


      <TextMessageBox 
        onSendMessage={ handlePost }
        placeholder='Escribe aquí lo que deseas'
        disableCorrections
      />

    </div>
  );
};
