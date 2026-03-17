import { useForm } from "react-hook-form"
import type { LoginForm } from '../../types/Auth'; 

export default function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();

  return (
    <div className="rounded-xl bg-white min-w-[850px] h-[500px] flex ">
      <div className="h-full w-[55%] bg-blue-500 rounded-l-xl p-10">
        Left Content
      </div>
      <div className="h-full w-[45%] flex flex-col items-center rounded-r-xl p-10">
        <div className="flex flex-col items-center">
          <h1>Login</h1>
          <p>Enter details or etc etc etc</p>
          <>
            
          </>
        </div>
      </div>
    </div>
  )
}
