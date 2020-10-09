// External

import React from 'react';

// Styles

import '../../styles/Utils/RangeSlider.scss';

interface SliderProps {
	currentDisplay?: number | string;
	maxDisplay?: number | string;
	min?: number;
	max?: number;
	value?: number;
	onChange?: (...args: any[]) => void;
}

const Slider = (props: SliderProps) => {
	return (
		<div className="range-container">
			<p>{props.currentDisplay}</p>
			<input type="range" min={props.min} max={props.max} value={props.value} className="range-slider" onChange={props.onChange}/>
			<p>{props.maxDisplay}</p>
		</div>
	);
};

export default Slider;
