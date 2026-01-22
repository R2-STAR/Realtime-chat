import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const ANIMALS = ["wolf", "hawk", "bear", "shark"]
const STORAGE_KEY = "chat_username"

const generateUsername = () => {
  const word = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `anonymous-${word}-${nanoid(5)}`
}

export const useUsername = () => {
  const [username, setUsername] = useState("");
    
  useEffect(() => {     //a React hook that runs side effects after render.
    const main = () => {
      const stored = localStorage.getItem(STORAGE_KEY) //Tries to read the username previously saved in the browser.
    
      if(stored) {
        setUsername(stored)
        return
      }

      //if user is connecting for first time
      const generated = generateUsername()
      localStorage.setItem(STORAGE_KEY, generated) //store the generated username in browser storage
      setUsername(generated)
    }

    main() 
  }, [])

  return { username } 
} 


