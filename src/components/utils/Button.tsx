// External

import React from "react";

// Declaration

interface ButtonProps {
	className: string;
	onClick: ((...args: any[]) => void) | undefined;
	text: string;
	type: "button" | "submit" | "reset" | undefined;
}

const Button = (props: ButtonProps) => {
	return (
		<button
			className={props.className}
			onClick={props.onClick}
			type={props.type}
		>
			<p>{props.text}</p>
		</button>
	);
};

export default Button;
