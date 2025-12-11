import aniVideo from './ani_video'
import aniScript from './ani_script'

import { addComponent } from '../connector'


export const animationsArray = [
    aniVideo, aniScript
    // { type: "ani_video", label: "Video", desc: ".mp4", ...aniVideo },
    // { type: "ani_script", label: "Script", desc: ".zip", ...aniScript },
]

addComponent({ array: animationsArray })
