'use strict'

const is_json_object=x=>{
	return x!==null&&typeof x==='object'&&!Array.isArray(x)
}

const get_json_localStorage=key=>{
	const j=localStorage.getItem(key)
	if(j)
		return JSON.parse(j)
}

const set_json_localStorage=(key,value)=>{
	const s=JSON.stringify(value)
	try{
		localStorage.setItem(key,s)
	}catch(error){
		console.error('set "%s" in localStorage failed:%o',key,error)
	}
}

let pokemon_search_table_promise
const get_pokemon_search_table=()=>{
	if(pokemon_search_table_promise===undefined){
		pokemon_search_table_promise=(async()=>{
			let result=get_json_localStorage('pokemon search table')
			if(result===undefined){
				const r=await fetch('https://pokeapi.co/api/v2/pokemon/?limit=-1',{credentials:'omit',referrerPolicy:'no-referrer'})
				if(!r.ok)
					throw Error(`http status ${r.status} ${r.statusText}`)
				const name_url_array=(await r.json())?.results
				if(!Array.isArray(name_url_array))
					throw Error('bad json structure')
				const url_pattern=/^https:\/\/pokeapi.co\/api\/v2\/pokemon\/\d+\/$/
				const ids=[],names=[]
				for(const name_url of name_url_array){
					const url=name_url?.url
					if(typeof url!=='string')
						throw Error('bad json structure')
					if(!url_pattern.test(url))
						throw Error('bad json structure')
					const id=+url.slice(34,-1)
					if(!Number.isSafeInteger(id))
						throw Error('id too big')
					const name=name_url.name
					if(typeof name!=='string')
						throw Error('bad json structure')
					ids.push(id)
					names.push(name)
				}
				result={ids,names}
				set_json_localStorage('pokemon search table',result)
			}
			return result
		})()
		pokemon_search_table_promise.catch(()=>{
			pokemon_search_table_promise=undefined
		})
	}
	return pokemon_search_table_promise
}

const pokemon_promises=new Map
const get_pokemon=id=>{
	let p=pokemon_promises.get(id)
	if(p===undefined){
		let result
		p=(async()=>{
			const localStorage_key=`pokemon ${id}`
			result=get_json_localStorage(localStorage_key)
			if(result===undefined){
				const r=await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`,{credentials:'omit',referrerPolicy:'no-referrer'})
				if(!r.ok)
					throw Error(`http status ${r.status} ${r.statusText}`)
				const j=await r.json()
				if(!is_json_object(j))
					throw Error('bad json structure')
				let hp=0,attack=0,defense=0,special_attack=0,special_defense=0,speed=0
				if(Array.isArray(j.stats)){
					for(const s of j.stats){
						const n=s?.base_stat
						if(typeof n!=='number')
							continue
						switch(s.stat?.name){
						case 'hp':
						      hp=n;break
						case 'attack':
						      attack=n;break
						case 'defense':
						      defense=n;break
						case 'special-attack':
						      special_attack=n;break
						case 'special-defense':
						      special_defense=n;break
						case 'speed':
						      speed=n;break
						}
					}
				}
				const types=[]
				if(Array.isArray(j.types)){
					for(const t of j.types){
						const name=t?.type?.name
						if(typeof name==='string')
							types.push(name)
					}
				}
				const sprite_url=
					j.sprites?.other?.['official-artwork']?.front_default
					||j.sprites?.other?.home?.front_default
				result={
					stats:[hp,attack,defense,special_attack,special_defense,speed],
					types,
					sprite_url:typeof sprite_url==='string'?sprite_url:'',
					name:typeof j.name==='string'?j.name:'',
					weight:typeof j.weight==='number'?j.weight:0,
					height:typeof j.height==='number'?j.height:0
				}
				set_json_localStorage(localStorage_key,result)
				p.pokemon=result
			}
			result.id=id
			return result
		})()
		if(result===undefined)
			p.catch(()=>{pokemon_promises.delete(id)})
		else
			p.pokemon=result
		pokemon_promises.set(id,p)
	}
	return p
}
const get_pokemon_no_download=id=>{
	let pokemon
	let promise=pokemon_promises.get(id)
	if(promise!==undefined){
		pokemon=promise.pokemon
		if(pokemon===undefined)
			throw Error('pokemon not finished downloading')
	}else{
		pokemon=get_json_localStorage(`pokemon ${id}`)
		if(pokemon===undefined)
			throw Error('pokemon not in localStorage')
		pokemon.id=id
		promise=Promise.resolve(pokemon)
		promise.pokemon=pokemon
		pokemon_promises.set(id,promise)
	}
	return pokemon
}

const nullprotoobj={__proto__:null}
const directset=(object,property,value)=>{
	if(!Reflect.set(nullprotoobj,property,value,object))
		throw Error('directset failed')
}

const xml_doc=document.implementation.createDocument(null,null)
const xhtml_div=xml_doc.createElementNS('http://www.w3.org/1999/xhtml','div')
const dot_node_finder=xml_doc.createExpression('(descendant::text()|descendant::node()/attribute::node())[starts-with(self::node(),".")]')
const xt=(s,set_dot_nodes=true)=>{
	xhtml_div.innerHTML=s
	const result=xhtml_div.firstChild
	if(result===null)
		throw Error('no root node')
	if(result!==xhtml_div.lastChild)
		throw Error('multiple root nodes')
	if(set_dot_nodes)
		for(const dot_nodes=dot_node_finder.evaluate(xhtml_div,4);;){
			const dot_node=dot_nodes.iterateNext()
			if(dot_node===null)
				break
			directset(result,dot_node.nodeValue.slice(1),dot_node)
		}
	xhtml_div.removeChild(result)
	return result
}
const xn=s=>{
	xhtml_div.innerHTML=s
	const result=xhtml_div.firstChild
	if(result===null)
		throw Error('no root node')
	if(result!==xhtml_div.lastChild)
		throw Error('multiple root nodes')
	document.adoptNode(result)
	return result
}

const tablabels=document.createElement('div')
tablabels.className='tablabels'
let current_tabcontent
const newtab=(tabname,tabcontent)=>{
	const r=document.createElement('input')
	r.className='tabradio'
	r.type='radio'
	r.name='tab'
	directset(r,'tabcontent',tabcontent)
	const s=document.createElement('span')
	s.className='tabname'
	s.append(tabname)
	const l=document.createElement('label')
	l.className='tablabel'
	l.append(r,s)
	tablabels.append(l)
	return r
}
tablabels.addEventListener('change',({target})=>{
	if(target.hasOwnProperty('tabcontent')){
		current_tabcontent.classList.remove('currenttabcontent');
		(current_tabcontent=target.tabcontent).classList.add('currenttabcontent')
	}
})

const poketype_styles={
	__proto__:null,
	bug:'background:#729f3f;color:white',
	dark:'background:#707070;color:white',
	dragon:'background:linear-gradient(#53a4cf 50%,#f16e57 50%);color:white',
	electric:'background:#eed535;color:black',
	fairy:'background:#fdb9e9;color:black',
	fighting:'background:#d56723;color:white',
	fire:'background:#fd7d24;color:white',
	flying:'background:linear-gradient(#3dc7ef 50%,#bdb9b8 50%);color:black',
	ghost:'background:#7b62a3;color:white',
	grass:'background:#9bcc50;color:black',
	ground:'background:linear-gradient(#f7de3f 50%,#ab9842 50%);color:black',
	ice:'background:#51c4e7;color:black',
	normal:'background:#a4acaf;color:black',
	poison:'background:#b97fc9;color:white',
	psychic:'background:#f366b9;color:white',
	rock:'background:#a38c21;color:white',
	steel:'background:#9eb7b8;color:black',
	water:'background:#4592c4;color:white'
}
const make_poketype=s=>{
	const n=document.createElement('div')
	n.className='poketype'
	const style=poketype_styles[s]
	if(style!==undefined)
		n.setAttribute('style',style)
	n.append(s)
	return n
}
const pokefind=xn('\
<div class="pokefind _root tabcontent currenttabcontent">\
<form style="display:contents">\
<input class="pokefind _searchinput" type="search"/>\
<input class="pokefind _searchbutton" value="search" type="submit"/>\
</form>\
<input class="pokefind _randombutton" value="random" type="submit"/>\
<div class="pokefind _result">\
<div class="pokefind _cards"/>\
<div class="pokefind _text">.</div>\
<input class="pokefind _loadmore" value="load more" type="button"/>\
</div>\
</div>\
')
const pokefind_search_input=pokefind.querySelector('._searchinput')
const pokefind_search_button=pokefind.querySelector('._searchbutton')
const pokefind_random_button=pokefind.querySelector('._randombutton')
const pokefind_result=pokefind.querySelector('._result')
const pokefind_cards=pokefind.querySelector('._cards')
const pokefind_text_element=pokefind.querySelector('._text')
const pokefind_text=pokefind_text_element.firstChild
const pokefind_loadmore_button=pokefind.querySelector('._loadmore')
let pokefind_ids=[]
const pokefind_look=(how,error)=>{
	//how:
	//	0 means loaded and no loadmore
	//	1 means loaded and yes loadmore
	//	2 means error (no loadmore)
	//	3 means loading (no loadmore)
	pokefind_random_button.disabled=pokefind_search_button.disabled=pokefind_search_input.disabled=how===3
	pokefind_loadmore_button.disabled=how!==1
	pokefind_text_element.className=how===2?'pokefind _text _error':'pokefind _text'
	switch(how){
	case 0:pokefind_text.data='no pokemon left to load';break
	case 1:pokefind_text.data='';break
	case 2:pokefind_text.data=error;break
	case 3:pokefind_text.data='loading';break
	}
}
const xt_pokecard=xt('\
<div class="pokecard _root">\
<div class="pokecard _name">.name</div>\
<img class="pokecard _sprite" src=".sprite_url"/>\
<div class="pokecard _types"/>\
<div class="pokecard _stats">\
<div class="pokecard _stat">.0</div>hp\
<div class="pokecard _stat">.1</div>attack\
<div class="pokecard _stat">.2</div>defense\
<div class="pokecard _stat">.3</div>special attack\
<div class="pokecard _stat">.4</div>special defense\
<div class="pokecard _stat">.5</div>speed\
</div>\
<input class="pokecard _catch" type="button" value="catch"/>\
</div>\
')
const pokefind_load_more=()=>{
	const promises=[]
	for(let id;promises.length<10&&(id=pokefind_ids.pop())!==undefined;)
		promises.push(get_pokemon(id))
	Promise.all(promises).then(pokemons=>{
		pokefind_look(Math.min(pokefind_ids.length,1))
		Element.prototype.append.apply(pokefind_cards,pokemons.map(pokemon=>{
			xt_pokecard.name.data=pokemon.name
			xt_pokecard.sprite_url.value=pokemon.sprite_url
			{
				const stats=pokemon.stats
				let i=0
				do
					xt_pokecard[i].data=stats[i]
				while(++i<6)
			}
			const pokecard=document.importNode(xt_pokecard,true)
			directset(pokecard.querySelector('._sprite'),'dialog_pokemon_id',pokemon.id)
			Element.prototype.append.apply(pokecard.querySelector('._types'),pokemon.types.map(make_poketype))
			directset(pokecard.querySelector('._catch'),'catch_pokemon_id',pokemon.id)
			return pokecard
		}))
	},error=>{
		console.error(error)
		pokefind_look(2,error)
	})
}
const pokefind_load_start=ids_promise=>{
	pokefind_look(3)
	pokefind_cards.replaceChildren()
	ids_promise.then(ids=>{
		pokefind_ids=ids
		pokefind_load_more()
	},error=>{
		console.error(error)
		pokefind_look(2,error)
	})
}
pokefind_loadmore_button.addEventListener('click',()=>{
	pokefind_look(3)
	pokefind_load_more()
})
pokefind_cards.addEventListener('click',({target})=>{
	if(target.hasOwnProperty('dialog_pokemon_id'))
		make_pokedialog(target.dialog_pokemon_id)
	else if(target.hasOwnProperty('catch_pokemon_id'))
		pokeown_catch(target.catch_pokemon_id)
})
const make_shuffled_ids=async()=>{
	const ids=(await get_pokemon_search_table()).ids.slice()
	let high_i=ids.length
	while(high_i>1){
		const low_i=Math.trunc(Math.random()*high_i)
		const low_id=ids[low_i]
		ids[low_i]=ids[--high_i]
		ids[high_i]=low_id
	}
	return ids
}
const make_searched_ids=async()=>{
	const searching_text=pokefind_search_input.value.toLowerCase()
	const{ids,names}=await get_pokemon_search_table()
	let i=ids.length
	const result=[]
	while(i>0)
		if(names[--i].includes(searching_text))
			result.push(ids[i])
	return result
}
pokefind.querySelector('form').addEventListener('submit',event=>{
	event.preventDefault()
	pokefind_load_start(make_searched_ids())
})
pokefind_random_button.addEventListener('click',()=>{
	pokefind_load_start(make_shuffled_ids())
})

const pokeown=xn('\
<div class="pokeown _root tabcontent">\
<div class="pokeown _stats">\
<div class="pokeown _stat">.</div>\
<div class="pokeown _stat">.</div>\
<div class="pokeown _stat"/>\
</div>\
<input placeholder="search" type="search"/>\
<div class="pokeown _cards"/>\
</div>\
')
const{childNodes:{
	0:{childNodes:{
		0:{firstChild:pokeown_stat_pokemons},
		1:{firstChild:pokeown_stat_max_level},
		2:pokeown_stat_common_type
	}},
	1:pokeown_search,
	2:pokeown_cards
}}=pokeown
const pokeown_array=get_json_localStorage('pokeown')||[]
const pokeown_save_localStorage=()=>{
	set_json_localStorage('pokeown',pokeown_array)
}
const pokeown_fix_stats=()=>{
	pokeown_stat_pokemons.data=`pokemons: ${pokeown_array.length}`
	if(pokeown_array.length===0){
		pokeown_stat_max_level.data='max level: ???'
	}else{
		let i=pokeown_array.length-1
		let max_level=pokeown_array[i].level
		while(i>0){
			const{level}=pokeown_array[--i]
			if(max_level<level)
				max_level=level
		}
		pokeown_stat_max_level.data=`max level: ${max_level}`
	}
	{
		const type_to_count_map=new Map
		let max_type_count=0
		for(const po of pokeown_array){
			for(const type of get_pokemon_no_download(po.base_pokemon_id).types){
				let type_count=type_to_count_map.get(type)
				type_count=type_count===undefined?1:type_count+1
				type_to_count_map.set(type,type_count)
				if(max_type_count<type_count)
					max_type_count=type_count
			}
		}
		const new_children=['most common types:']
		type_to_count_map.forEach((type_count,type)=>{
			if(type_count===max_type_count)
				new_children.push(make_poketype(type))
		})
		Element.prototype.replaceChildren.apply(pokeown_stat_common_type,new_children)
	}
}
pokeown_fix_stats()
const pokeown_catch=base_pokemon_id=>{
	//const kind=get_pokemon_no_download(id)
	const owned_pokemon={
		base_pokemon_id,
		catch_time:Date.now(),
		level:0,
		plus_stats:[0,0,0,0,0,0]
	}
	pokeown_array.push(owned_pokemon)
	pokeown_save_localStorage()
	pokeown_fix_stats()
	pokeown_cards.append(make_owned_pokecard(owned_pokemon))
}
const xt_owned_pokecard=xt('\
<div>\
<div class="pokecard _name">.</div>\
<img class="pokecard _sprite"/>\
<div class="pokecard _types"/>\
<div>\
<div>.</div><button class="pokecard _plusbutton">+</button>hp\
<div>.</div><button class="pokecard _plusbutton">+</button>attack\
<div>.</div><button class="pokecard _plusbutton">+</button>defense\
<div>.</div><button class="pokecard _plusbutton">+</button>special attack\
<div>.</div><button class="pokecard _plusbutton">+</button>special defense\
<div>.</div><button class="pokecard _plusbutton">+</button>speed\
</div>\
.\
<div class="pokecard _own"><input class="pokecard" value="train" type="button"/>.</div>\
<input class="pokecard _catch" value="release" type="button"/>\
</div>\
',false)
const make_owned_pokecard=owned_pokemon=>{
	const c=document.importNode(xt_owned_pokecard,true)
	directset(c,'owned_pokemon',owned_pokemon)
	let n2
	directset(c,'name',(n2=c.firstChild).firstChild)
	directset(c,'sprite',n2=n2.nextSibling)
	directset(n2,'dialog_owned_pokemon',owned_pokemon)
	directset(c,'types',n2=n2.nextSibling)
	directset(c,'stats_element',n2=n2.nextSibling)
	const stats=[]
	let n=n2.firstChild
	let i=0
	while(
		stats.push(n),
		directset(n=n.nextSibling,'plusbutton_owned_pokecard',c),
		directset(n,'plusbutton_stat',i),
		++i<6
	)
		n=n.nextElementSibling
	directset(c,'stats',stats)
	const t=new Date(owned_pokemon.catch_time);
	(n2=n2.nextSibling).data=`caught ${t.getFullYear()}-${`${t.getMonth()+1}`.padStart(2,'0')}-${`${t.getDate()}`.padStart(2,'0')} ${`${t.getHours()}`.padStart(2,'0')}:${`${t.getMinutes()}`.padStart(2,'0')}`
	directset(n=(n2=n2.nextSibling).firstChild,'train_owned_pokecard',c)
	directset(c,'level',n.nextSibling)
	directset(n2.nextSibling,'release_owned_pokecard',c)
	fix_owned_pokecard(c,true,true,true)
	return c
}
let pokeown_search_text=''
pokeown_search.addEventListener('input',()=>{
	pokeown_search_text=pokeown_search.value.toLowerCase()
	let owned_pokecard=pokeown_cards.firstChild
	while(owned_pokecard!==null){
		fix_owned_pokecard(owned_pokecard,true,false,false)
		owned_pokecard=owned_pokecard.nextSibling
	}
})

const fix_owned_pokecard=(c,fix_search,fix_base,fix_stats_and_level)=>{
	const op=c.owned_pokemon
	const p=get_pokemon_no_download(op.base_pokemon_id)
	if(fix_search){
		c.className=p.name.includes(pokeown_search_text)?'pokecard _root':'pokecard _root _hidden'
	}
	if(fix_base){
		c.name.data=p.name
		c.sprite.setAttribute('src',p.sprite_url)
		Element.prototype.replaceChildren.apply(c.types,p.types.map(make_poketype))
	}
	if(fix_stats_and_level){
		const base_stats=p.stats
		const{level,plus_stats}=op
		const stat_elements=c.stats
		let plus_sum=0
		let i=0
		do{
			const plus=plus_stats[i]
			plus_sum+=plus
			const element=stat_elements[i]
			element.className=plus===0?'pokecard _stat':'pokecard _stat _upgraded'
			element.firstChild.data=base_stats[i]+plus
		}while(++i<6)
		if(plus_sum<level){
			c.stats_element.className='pokecard _stats _plusbuttons _can_upgrade'
			c.level.data=`level ${level}, unused ${level-plus_sum}`
		}else{
			c.stats_element.className='pokecard _stats _plusbuttons'
			c.level.data=`level ${level}`
		}
	}
}
pokeown_cards.addEventListener('click',({target})=>{
	if(target.hasOwnProperty('dialog_owned_pokemon')){
		const op=target.dialog_owned_pokemon
		make_pokedialog(op.base_pokemon_id,op)
	}else if(target.hasOwnProperty('plusbutton_owned_pokecard')){
		const c=target.plusbutton_owned_pokecard
		++c.owned_pokemon.plus_stats[target.plusbutton_stat]
		pokeown_save_localStorage()
		fix_owned_pokecard(c,false,false,true)
	}else if(target.hasOwnProperty('train_owned_pokecard')){
		const c=target.train_owned_pokecard
		++c.owned_pokemon.level
		pokeown_save_localStorage()
		pokeown_fix_stats()
		fix_owned_pokecard(c,false,false,true)
	}else if(target.hasOwnProperty('release_owned_pokecard')){
		const c=target.release_owned_pokecard
		const i=pokeown_array.indexOf(c.owned_pokemon)
		if(i===-1)
			throw Error('owned pokemon not in array')
		pokeown_array.splice(i,1)
		pokeown_save_localStorage()
		pokeown_fix_stats()
		c.remove()
	}
})
Element.prototype.append.apply(pokeown_cards,pokeown_array.map(make_owned_pokecard))

const xt_pokedialog=xt('\
<dialog class="pokedialog _root" closedby="any">\
<div class="pokedialog pokecard _name">.name</div>\
<img class="pokedialog _sprite" src=".sprite_url"/>\
<div class="pokedialog _whs">\
<div class="pokedialog _wh">.weight</div>weight\
<div class="pokedialog _wh">.height</div>height\
</div>\
<div class="pokedialog pokecard _types"/>\
<div class="pokedialog pokecard _stats">\
<div class="pokecard _stat">,</div>hp\
<div class="pokecard _stat">,</div>attack\
<div class="pokecard _stat">,</div>defense\
<div class="pokecard _stat">,</div>special attack\
<div class="pokecard _stat">,</div>special defense\
<div class="pokecard _stat">,</div>speed\
</div>\
</dialog>\
')
const make_pokedialog=(pokemon_id,owned_pokemon)=>{
	const pokemon=get_pokemon_no_download(pokemon_id)
	xt_pokedialog.name.data=pokemon.name
	xt_pokedialog.sprite_url.value=pokemon.sprite_url
	xt_pokedialog.weight.data=pokemon.weight
	xt_pokedialog.height.data=pokemon.height
	const dialog=document.importNode(xt_pokedialog,true)
	const first_stat=dialog.querySelector('._stat')
	{
		const stats=pokemon.stats
		let i=0
		let n=first_stat
		while(
			n.firstChild.data=stats[i],
			++i<6
		)
			n=n.nextElementSibling
	}
	if(owned_pokemon!==undefined){
		first_stat.parentNode.className='pokedialog pokecard _stats _dialogplus'
		const{plus_stats}=owned_pokemon
		let i=0
		let n=first_stat
		let p
		while(
			p=document.createElement('div'),
			p.className='pokecard _stat _upgraded',
			p.append(`+${plus_stats[i]}`),
			n.after(p),
			++i<6
		)
			n=p.nextElementSibling
	}
	Element.prototype.append.apply(dialog.querySelector('._types'),pokemon.types.map(make_poketype))
	dialog.addEventListener('cancel',event=>{
		event.preventDefault()
		dialog.remove()
	})
	document.body.append(dialog)
	dialog.showModal()
}

newtab('search',current_tabcontent=pokefind).checked=true
newtab('my collection',pokeown)

pokefind_load_start(make_shuffled_ids())
document.body.append(tablabels,pokefind,pokeown)