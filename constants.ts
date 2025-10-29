
import type { AboutData, ContactLink } from './types';

export const contactData: ContactLink[] = [
    { name: "YouTube", url: "https://www.youtube.com", icon: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png" },
    { name: "Instagram", url: "https://www.instagram.com/twoong_studio?igsh=MW5jcnE0MHFvODhtNQ==", icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" },
    { name: "Vimeo", url: "https://vimeo.com", icon: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Vimeo.svg" },
    { name: "Email", url: "mailto:contact@example.com", icon: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" },
    { name: "LinkedIn", url: "https://www.linkedin.com", icon: "https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg"  }
];

export const initialAboutData: AboutData = {
    equipmentData: [
        { name: "Sony", icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg" },
        { name: "Aputure", icon: "https://iconape.com/wp-content/files/yy/277008/png/aputure-logo.png" },
        { name: "Nanlite", icon: "https://images.seeklogo.com/logo-png/61/1/nanlite-logo-png_seeklogo-616371.png" },
        { name: "DJI", icon: "https://upload.wikimedia.org/wikipedia/commons/9/9a/DJI_Innovations_logo.svg" },
        { name: "Amaran", icon: "https://cattscamera.com/img/cms/amaran-grande.jpg" }
    ], 
    toolData: [
        { name: "DaVinci Resolve", proficiency: 'Proficient', icon: "https://upload.wikimedia.org/wikipedia/commons/9/90/DaVinci_Resolve_17_logo.svg" }, 
        { name: "After Effects", proficiency: 'Proficient', icon: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Adobe_After_Effects_CC_icon.svg" }, 
        { name: "Premiere Pro", proficiency: 'Proficient', icon: "https://upload.wikimedia.org/wikipedia/commons/4/40/Adobe_Premiere_Pro_CC_icon.svg" }, 
        { name: "AutoCAD", proficiency: 'Proficient', icon: "https://i.namu.wiki/i/zk1A0yo4P-Ds9oqvo6UHNRagrWtElHOJjBoqxoL1jMEWkQ4Vo3AYe4zWPtiEDEf98GNDzy5i_4HBKgWdk0TxMt1IVsVESuL1PtliJt0tNZdfqtidIMb10j5l2ljqMSBOkRDmd6iocAI86bK77A9YCw.webp" },
        { name: "Nuke", proficiency: 'Familiar', icon: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Nuclear_symbol.svg" },
        { name: "Adobe Illustrator", proficiency: 'Familiar', icon: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Adobe_Illustrator_CC_icon.svg" },
        { name: "SketchUp", proficiency: 'Familiar', icon: "https://www.softfully.com/pics/sketchup-pro-150x150.webp" },
        { name: "Photoshop", proficiency: 'Familiar', icon: "https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg" }
    ], 
    workStyleData: ['Creative', 'Detail-Oriented', 'Collaborative', 'Proactive', 'Efficient', 'Adaptable'] 
};
