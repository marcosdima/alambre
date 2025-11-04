import { AnimadoTypes } from "@types"
import { Animated } from "react-native";

const parseConfig = (
    anim: Animated.Value,
    {
        opacity,
        scale,
        translateX,
        translateY,
        rotate,
    }: AnimadoTypes.AnimadoConfig
) => {
    const result = {};
    if (opacity) Object.assign(result, { opacity: parseValue(opacity, anim) });

    const transforms = [];
    if (scale) transforms.push({ scale: parseValue(scale, anim) });
    if (translateX) transforms.push({ translateX: parseValue(translateX, anim) });
    if (translateY) transforms.push({ translateY: parseValue(translateY, anim) });
    if (rotate) transforms.push({ rotate: parseValue(rotate, anim) });
    if (transforms.length > 0) Object.assign(result, { transform: transforms });
    
    return result;
}

const parseValue = (value: AnimadoTypes.AnimadoValue, anim: Animated.Value) => {
    if (typeof value === 'boolean') {
        return anim;
    } else {
        return anim.interpolate({
            inputRange: value.inputRange,
            outputRange: value.outputRange,
        });
    }
}

export { parseConfig, parseValue };