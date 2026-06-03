import { Bounce, toast } from "react-toastify";

export const phoneValidation = (number) => {
    return /^\d{10,10}$/.test(number);
}

export const showMessage = (message, type) => {
    const toastOption = {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
    }
    switch (type) {
        case 'info':
            return toast.info(message, toastOption);
            break;
        case 'success':
            return toast.success(message, toastOption);
            break;
        case 'error':
            return toast.error(message, toastOption);
            break;
        case 'warning':
            return toast.warn(message, toastOption);
            break;
        default:
            return toast.error(message, toastOption);
    }
}

export const generatePasswordCustom = (len = 8) => {
    const chars = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789", "@$!%*?&"];
    const all = chars.join("");

    // 1. Start with the required sequence
    let pass = chars.map(s => s[Math.floor(Math.random() * s.length)]).join("");

    // 2. Fill the rest randomly
    while (pass.length < len) pass += all[Math.floor(Math.random() * all.length)];

    return pass;
};

export function scrollToView(id) {
    const targetElement = document.getElementById(id)
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth', // Optional: 'auto' (instant) or 'smooth'
            block: 'start',     // Optional: 'start', 'center', 'end', or 'nearest'
            inline: 'nearest'   // Optional: 'start', 'center', 'end', or 'nearest'
        });
    }
}

