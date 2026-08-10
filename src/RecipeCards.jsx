import { cc_recipes } from "./main.jsx"
import { recipe_download_error, id_to_recipe_map } from "./download recipes.jsx"
import { string_or_question, format_time } from "./recipe display misc.js"
import { Link } from "react-router"

const recipe_format_total_time=({prepTimeMinutes,cookTimeMinutes})=>{
	if(typeof prepTimeMinutes!=="number"||typeof cookTimeMinutes!=="number")return "?"
	return format_time(prepTimeMinutes+cookTimeMinutes)
}

const canvas=document.createElement("canvas")
canvas.setAttribute("width","16")
canvas.setAttribute("height","16")
const context=canvas.getContext("2d",{willReadFrequently:true})

const handle_load_event=({target})=>{
	context.clearRect(0,0,16,16)
	context.imageSmoothingEnabled=false
	context.drawImage(target,0,0,16,16)
	const a=context.getImageData(0,0,16,16).data
	let s_red=0,s_green=0,s_blue=0,s_ungreyness=0,i=0
	do{
		let red=a[i++],green=a[i++],blue=a[i++]
		red=red*red*0.00001537870049980776624375
		green=green*green*0.00001537870049980776624375
		blue=blue*blue*0.00001537870049980776624375
		let ungreyness=Math.max(red,green,blue)-Math.min(red,green,blue)
		ungreyness*=ungreyness
		s_red+=red*ungreyness
		s_green+=green*ungreyness
		s_blue+=blue*ungreyness
		s_ungreyness+=ungreyness
	}while(++i!==1024)
	const d=Math.max(s_ungreyness,1)
	s_red=Math.round(Math.sqrt(s_red/d)*255)
	s_green=Math.round(Math.sqrt(s_green/d)*255)
	s_blue=Math.round(Math.sqrt(s_blue/d)*255)
	target.parentNode.style.setProperty(
		"--CardColor",
		`#${"0123456789ABCDEF".charAt(s_red>>4)
		}${"0123456789ABCDEF".charAt(s_red&15)
		}${"0123456789ABCDEF".charAt(s_green>>4)
		}${"0123456789ABCDEF".charAt(s_green&15)
		}${"0123456789ABCDEF".charAt(s_blue>>4)
		}${"0123456789ABCDEF".charAt(s_blue&15)
		}55`
	)
}

const recipe_to_card_jsx=recipe=>{
	const id_str=`${recipe.id}`
	return <Link key={id_str} to={`recipe/${id_str}`}>
		<img src={string_or_question(recipe.image)} alt="" loading="lazy" crossOrigin="anonymous" onLoad={handle_load_event}/>
		<div>{string_or_question(recipe.name)}</div>
		<div>{string_or_question(recipe.cuisine)}</div>
		<div>{recipe_format_total_time(recipe)}</div>
	</Link>
}

export default ()=>{
	cc_recipes.use()
	for(const e of recipe_download_error)return e

	return <div className="RecipeCards">{Array.from(id_to_recipe_map.values(),recipe_to_card_jsx)}</div>
}