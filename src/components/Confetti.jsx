import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ConfettiPiece = ({ x, y, rotation, color }) => {
    const variants = {
        initial: {
            opacity: 1,
            y: -10,
            x: '50vw',
            rotate: 0,
        },
        animate: {
            opacity: [1, 1, 0],
            y: '110vh',
            x: `${x}vw`,
            rotate: rotation,
            transition: {
                duration: Math.random() * 2 + 3,
                ease: 'linear',
            },
        },
    };

    return (
        <motion.div
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '10px',
                height: '20px',
                backgroundColor: color,
                pointerEvents: 'none',
                zIndex: 9999,
            }}
            variants={variants}
            initial="initial"
            animate="animate"
        />
    );
};

const Confetti = () => {
    const [pieces, setPieces] = useState([]);

    useEffect(() => {
        const generatePieces = () => {
            const newPieces = Array.from({ length: 150 }).map((_, i) => {
                const colors = ['#F26513', '#0378A6', '#FFC700', '#FFFFFF'];
                return {
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    rotation: Math.random() * 360 * 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                };
            });
            setPieces(newPieces);
        };

        generatePieces();
    }, []);

    return <>{pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}</>;
};

export default Confetti;