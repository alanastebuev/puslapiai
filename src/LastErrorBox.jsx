import { cc_last_error } from "./main.jsx"

//let last_error_text=null
let last_error_text="šitas dialogas planuotas naudoti localStorage kaidai rodyti, bet mėgstamų sąrašą nespėjau padaryti"

export const log_and_display_error=(error_text,error_object_only_in_log)=>{
	console.error("%s:%o",error_text,error_object_only_in_log)
	last_error_text=error_text
	cc_last_error.notify()
}

const clear_last_error=()=>{
	last_error_text=null
	cc_last_error.notify()
}

export const LastErrorBox=()=>{
	cc_last_error.use()
	if(last_error_text===null)return null
	return <div class="LastErrorBox">
		<div>
			{last_error_text}
			<button onClick={clear_last_error}/>
		</div>
	</div>
}

//window.log_and_display_error=log_and_display_error