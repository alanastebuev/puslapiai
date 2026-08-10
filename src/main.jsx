import { createRoot } from "react-dom/client"
import { createBrowserRouter, NavLink, Outlet } from "react-router"
import { RouterProvider } from "react-router/dom"
import { useState, useContext, createContext } from "react"

import { LastErrorBox } from "./LastErrorBox.jsx"
import RecipeCards from "./RecipeCards.jsx"
import RecipePage from "./RecipePage.jsx"

import "./styling/a.css"
import "./styling/b.css"

const big_jsx=<RouterProvider router={createBrowserRouter([
	{
		path:"/",
		element:<>
			<nav>
				<NavLink to="/">recipes</NavLink>
			</nav>
			<Outlet/>
			<LastErrorBox/>
		</>,
		children:[
			{
				path:"",
				Component:RecipeCards
			},
			{
				path:"recipe/:id",
				Component:RecipePage
			}
		]
	}
])}/>

let app_render_counter=0
let app_state_setter=null

const Context_and_counter=class{
	context=createContext(0)
	counter=0
	use(){useContext(this.context)}
	notify(){app_state_setter?.(this.counter=app_render_counter)}
}

const ccs=[]
export const[
	cc_recipes,//notified when recipes finished downloading (error or not) or when favourites changed
//	cc_recipes_filter,
//	cc_favorites,
	cc_last_error
]=function*(){
	for(;;){
		const cc=new Context_and_counter
		ccs.push(cc)
		yield cc
	}
}()

const surround_jsx_with_cc_cotext=(jsx,cc)=><cc.context value={cc.counter}>{jsx}</cc.context>

const App=()=>{
	if(++app_render_counter===1)app_state_setter=useState(0)[1]//grab state setter on first render and let everything use it forever
	else useState(0)//call useState because react needs same sequence of useWhatever calls every render

	return ccs.reduce(surround_jsx_with_cc_cotext,big_jsx)
}

createRoot(ReactRoot).render(<App/>)