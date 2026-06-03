export const calculateTime = (date) => {

    const d = new Date(date);

    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    const formatted = `${day} ${month}, ${year}  ${hours}.${minutes}${ampm}`;

    return formatted;
}


export const formatDate = (rawDate) => {
    const dateObj = new Date(rawDate.replace(' ', 'T'));
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(dateObj);

    return formattedDate;
}