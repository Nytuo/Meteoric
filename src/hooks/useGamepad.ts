import { useEffect, useRef, useState } from "react";

export type GamepadButton = 
	| "A" | "B" | "X" | "Y" 
	| "LB" | "RB" | "LT" | "RT"
	| "Back" | "Start"
	| "DPadUp" | "DPadDown" | "DPadLeft" | "DPadRight"
	| "LeftStickUp" | "LeftStickDown" | "LeftStickLeft" | "LeftStickRight"
	| "RightStickUp" | "RightStickDown" | "RightStickLeft" | "RightStickRight";

export interface GamepadHookOptions {
	deadzone?: number; // Analog stick deadzone (default: 0.5)
	onButtonPress?: (button: GamepadButton) => void;
	enabled?: boolean; // Allow enabling/disabling the hook
}

/**
 * Custom hook for gamepad/controller support with Xbox button mapping
 * Polls for gamepad input and triggers callbacks on button press
 */
export function useGamepad(options: GamepadHookOptions = {}) {
	const { deadzone = 0.5, onButtonPress, enabled = true } = options;
	
	const [gamepadConnected, setGamepadConnected] = useState(false);
	const gamepadRAF = useRef<number | null>(null);
	const lastButtonState = useRef<Record<number, boolean>>({});
	const lastAxisState = useRef<{ x: number; y: number; rx: number; ry: number }>({ x: 0, y: 0, rx: 0, ry: 0 });

	useEffect(() => {
		if (!enabled) return;

		const handleConnect = () => setGamepadConnected(true);
		const handleDisconnect = () => {
			if (!navigator.getGamepads || !Array.from(navigator.getGamepads()).some(Boolean)) {
				setGamepadConnected(false);
			}
		};

		window.addEventListener("gamepadconnected", handleConnect);
		window.addEventListener("gamepaddisconnected", handleDisconnect);

		const poll = () => {
			const pads = navigator.getGamepads ? navigator.getGamepads() : [];
			
			for (const pad of pads) {
				if (!pad) continue;
				
				setGamepadConnected(true);
				const buttons = pad.buttons;
				
				// Button mapping (Xbox controller standard)
				// 0=A, 1=B, 2=X, 3=Y, 4=LB, 5=RB, 6=LT, 7=RT,
				// 8=Back, 9=Start, 12=DUp, 13=DDown, 14=DLeft, 15=DRight
				const buttonMap: Array<[number, GamepadButton]> = [
					[0, "A"], [1, "B"], [2, "X"], [3, "Y"],
					[4, "LB"], [5, "RB"], [6, "LT"], [7, "RT"],
					[8, "Back"], [9, "Start"],
					[12, "DPadUp"], [13, "DPadDown"], [14, "DPadLeft"], [15, "DPadRight"],
				];

				// Check for button press changes
				for (const [idx, button] of buttonMap) {
					const wasPressed = lastButtonState.current[idx] ?? false;
					const isPressed = buttons[idx]?.pressed ?? false;
					
					if (isPressed && !wasPressed) {
						onButtonPress?.(button);
					}
					
					lastButtonState.current[idx] = isPressed;
				}

				// Left analog stick (axes 0 and 1)
				const axisX = pad.axes[0] ?? 0;
				const axisY = pad.axes[1] ?? 0;
				const prevX = lastAxisState.current.x;
				const prevY = lastAxisState.current.y;

				// Horizontal movement
				if (axisX < -deadzone && Math.abs(prevX) < deadzone) {
					onButtonPress?.("LeftStickLeft");
				} else if (axisX > deadzone && Math.abs(prevX) < deadzone) {
					onButtonPress?.("LeftStickRight");
				}

				// Vertical movement
				if (axisY < -deadzone && Math.abs(prevY) < deadzone) {
					onButtonPress?.("LeftStickUp");
				} else if (axisY > deadzone && Math.abs(prevY) < deadzone) {
					onButtonPress?.("LeftStickDown");
				}

				// Right analog stick (axes 2 and 3)
				const axisRX = pad.axes[2] ?? 0;
				const axisRY = pad.axes[3] ?? 0;
				const prevRX = lastAxisState.current.rx;
				const prevRY = lastAxisState.current.ry;

				// Horizontal movement
				if (axisRX < -deadzone && Math.abs(prevRX) < deadzone) {
					onButtonPress?.("RightStickLeft");
				} else if (axisRX > deadzone && Math.abs(prevRX) < deadzone) {
					onButtonPress?.("RightStickRight");
				}

				// Vertical movement
				if (axisRY < -deadzone && Math.abs(prevRY) < deadzone) {
					onButtonPress?.("RightStickUp");
				} else if (axisRY > deadzone && Math.abs(prevRY) < deadzone) {
					onButtonPress?.("RightStickDown");
				}

				lastAxisState.current = { x: axisX, y: axisY, rx: axisRX, ry: axisRY };
			}

			gamepadRAF.current = requestAnimationFrame(poll);
		};

		gamepadRAF.current = requestAnimationFrame(poll);

		return () => {
			if (gamepadRAF.current) cancelAnimationFrame(gamepadRAF.current);
			window.removeEventListener("gamepadconnected", handleConnect);
			window.removeEventListener("gamepaddisconnected", handleDisconnect);
		};
	}, [enabled, deadzone, onButtonPress]);

	return { gamepadConnected };
}
