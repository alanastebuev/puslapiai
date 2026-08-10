import { cc_recipes } from "./main.jsx"
import { recipe_download_error, id_to_recipe_map } from "./download recipes.jsx"
import { useParams } from "react-router"
import { string_or_question, array_or_empty_read_only, format_time } from "./recipe display misc.js"

const make_li=(s,i)=><li key={`${i}`}>{string_or_question(s)}</li>

export default ()=>{
	const params=useParams()
	cc_recipes.use()

	for(const e of recipe_download_error)return e
	const recipe=id_to_recipe_map.get(parseInt(params.id,10))
	if(recipe===undefined)return <div className="Status Error">recipe not found</div>

	return <article className="RecipePage">
		<h1>{string_or_question(recipe.name)}</h1>
		<img src={string_or_question(recipe.image)} alt="" loading="lazy" crossOrigin="anonymous"/>
		<h2>Ingredients</h2>
		<ul>{array_or_empty_read_only(recipe.ingredients).map(make_li)}</ul>
		<h2>Instructions</h2>
		<ol>{array_or_empty_read_only(recipe.instructions).map(make_li)}</ol>
		<p>{`${format_time(recipe.prepTimeMinutes)} preparation, ${format_time(recipe.cookTimeMinutes)} cooking`}</p>
		<p>{`Difficulty: ${string_or_question(recipe.difficulty)}`}</p>
	</article>
}