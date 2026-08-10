<?php

function ErrorBoxBorder($h,$s,$l_fill,$l_stroke){
ob_start();
?><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
	<rect
		x="1"
		y="1"
		width="22"
		height="22"
		shape-rendering="optimizeSpeed"
		fill="hsl(<?=$h?>,<?=$s?>%,<?=$l_fill?>%)"
		stroke="hsl(<?=$h?>,<?=$s?>%,<?=$l_stroke?>%)"
		stroke-width="2"
		paint-order="stroke fill"
		rx="5"
		ry="5"
	/>
</svg><?php
return base64_encode(ob_get_clean());
}

function X($h,$s,$l_fill0,$l_stroke0,$l_fill1,$l_stroke1,$l_fill2,$l_stroke2,$l_X){
$in=6+1/256;
ob_start();
?><svg xmlns="http://www.w3.org/2000/svg" width="24" height="<?=24*3?>">
	<defs><g id="X">
		<rect
			x="1" y="1"
			width="22" height="22"
			shape-rendering="optimizeSpeed"
			stroke-width="2"
			paint-order="stroke fill"
			rx="5" ry="5"
		/>
		<line
			x1="<?=24-$in?>" y1="<?=24-$in?>"
			x2="<?=$in?>" y2="<?=$in?>"
			shape-rendering="optimizeSpeed"
			stroke="hsl(<?=$h?>,<?=$s?>%,<?=$l_X?>%)"
			stroke-width="2"
		/>
		<line
			x1="<?=$in?>" y1="<?=24-$in?>"
			x2="<?=24-$in?>" y2="<?=$in?>"
			shape-rendering="optimizeSpeed"
			stroke="hsl(<?=$h?>,<?=$s?>%,<?=$l_X?>%)"
			stroke-width="2"
		/>
	</g></defs>
	<use fill="hsl(<?=$h?>,<?=$s?>%,<?=$l_fill0?>%)" stroke="hsl(<?=$h?>,<?=$s?>%,<?=$l_stroke0?>%)" href="#X"/>
	<use fill="hsl(<?=$h?>,<?=$s?>%,<?=$l_fill1?>%)" stroke="hsl(<?=$h?>,<?=$s?>%,<?=$l_stroke1?>%)" y="24" href="#X"/>
	<use fill="hsl(<?=$h?>,<?=$s?>%,<?=$l_fill2?>%)" stroke="hsl(<?=$h?>,<?=$s?>%,<?=$l_stroke2?>%)" y="48" href="#X"/>
</svg><?php
return base64_encode(ob_get_clean());
}

ob_start();
?>:root{
	--ErrorBoxBorder:url("data:image/svg+xml;charset=l1;base64,<?=ErrorBoxBorder(
		0,100,

		90,60
	)?>");
	--X:url("data:image/svg+xml;charset=l1;base64,<?=X(
		0,100,

		90,70,
		88,68,
		85,65,

		50
	)?>");
}<?php
file_put_contents('src/styling/b.css',ob_get_clean());