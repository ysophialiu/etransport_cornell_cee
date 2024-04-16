import React, {useEffect, useState} from 'react';

const TableOfContents = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const elements = Array.from(document.querySelectorAll(".subtitle"));
        const elementsData = elements.map((e, _) => ({
            id: e.id,
            text: e.textContent,
            offsetTop: e.offsetTop
        }));

        setItems(elementsData);
    }, []);

    const handleClick = (id) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop,
                behavior: 'smooth'
            });
        }
    };

    return (
        <ul>
            {items.map(item => (
                <li key={item.id} onClick={() => handleClick(item.id)}>
                    {item.text}
                </li>
            ))}
        </ul>
    );
};

export default TableOfContents;