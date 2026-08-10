import { cc_recipes } from "./main.jsx"

export const recipe_download_error=[<div className="Status Downloading">downloading recipes</div>]
export const id_to_recipe_map=new Map

const is_json_object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);

/*if(name){
	for(const r of JSON.parse(name))id_to_recipe_map.set(r.id,r)
	recipe_download_error.length=0
}else*/

(async()=>{
	try{
		const response=await fetch("https://dummyjson.com/recipes?limit=0",{credentials:"omit",referrerPolicy:"no-referrer"})
		if(!response.ok){
			recipe_download_error[0]=<div className="Status Error">{`recipes download http status ${response.status} ${response.statusText}`}</div>
			return
		}
		const response_obj=await response.json()
		if(!is_json_object(response_obj)){
			console.error("recipes download json root is not object:%o",response_obj)
			recipe_download_error[0]=<div className="Status Error">recipes download json root is not object</div>
			return
		}
		const recipes_array=response_obj.recipes
		if(!Array.isArray(recipes_array)){
			console.error("recipes download json root.recipes is not array, root:%o",response_obj)
			recipe_download_error[0]=<div className="Status Error">recipes download json root.recipes is not array</div>
			return
		}
		for(const recipe of recipes_array){
			if(!is_json_object(recipe)){
				console.warn("downloaded recipe is not object:%o",recipe)
				continue
			}
			if(typeof recipe.id!=="number"){
				console.warn("downloaded recipe id not number:%o",recipe)
				continue
			}
			if(id_to_recipe_map.has(recipe.id)){
				console.warn("downloaded recipes with same id:%o,%o",id_to_recipe_map.get(recipe.id),recipe)
				continue
			}
			id_to_recipe_map.set(recipe.id,recipe)
		}
		//name=JSON.stringify(id_to_recipe_map.values().toArray())//DELETE THIS LINE
		recipe_download_error.length=0
	}catch(error){
		console.error("recipes download error:%o",error)
		error[0]=<div className="DownloadError">recipes download error</div>
	}finally{
		cc_recipes.notify()
	}
})()
