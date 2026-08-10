export const
string_or_question=x=>typeof x==="string"?x:"?",
//number_to_string_or_question=x=>typeof x==="number"?`${x}`:"?",
array_or_empty_read_only=a=>Array.isArray(a)?a:Array.prototype,
format_time=total_min=>{
	if(typeof total_min!=="number")return "?"
	if(total_min<60)return `${total_min} min`
	const min=total_min%60,h=Math.trunc(total_min/60)
	if(min===0)return `${h} h`
	return `${h} h ${min} min`
}