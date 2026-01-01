'use client';

import React, { useEffect, useRef, useState } from 'react';

const LuckyEnvelope = () => {
	// For now, completely hide the lucky envelope component
	return null;

	// Initialize hidden state from localStorage immediately
	const [isHidden, setIsHidden] = useState(() => {
		if (typeof window !== 'undefined') {
			const hidden = localStorage.getItem('lucky-envelope-hidden');
			console.log('[LuckyEnvelope] Initial hidden state:', hidden);
			return hidden === 'true';
		}
		return true; // Default to hidden
	});
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (open && modalRef.current && e.target === modalRef.current) {
				setOpen(false);
			}
		};
		window.addEventListener('click', onClick);
		return () => window.removeEventListener('click', onClick);
	}, [open]);

	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText('TET2026');
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	};

	const hideLuckyEnvelope = () => {
		setIsHidden(true);
		localStorage.setItem('lucky-envelope-hidden', 'true');
	};

	// Don't render if hidden
	if (isHidden) {
		return null;
	}

	return (
		<div className='lucky-wrapper'>
			<div
				className='lucky-btn'
				onClick={() => setOpen(true)}
				role={'button'}
				aria-label={'Nhận lì xì'}
			>
				<div className='lucky-icon'>🧧</div>
				<div className='lucky-tooltip'>
					Nhận Lì Xì
					<button className='tooltip-close-btn' onClick={(e) => { e.stopPropagation(); hideLuckyEnvelope(); }}>&times;</button>
				</div>
			</div>

			<div className={`lucky-modal ${open ? 'active' : ''}`} ref={modalRef}>
				<div className='modal-content' role={'dialog'} aria-modal={true} aria-label={'Lì xì'}>
					<button className='close-btn' onClick={() => setOpen(false)}>
						&times;
					</button>
					<div className='modal-header'>CHÚC MỪNG NĂM MỚI</div>
					<div className='modal-body'>
						<p>Bạn nhận được mã giảm giá:</p>
						<h2 className='discount-code'>TET2026</h2>
						<p>
							Giảm <strong>500.000đ</strong> cho đơn hàng đầu tiên
						</p>
						<button className='btn-copy' onClick={copyCode}>
							{copied ? 'Đã Sao Chép!' : 'Sao Chép Mã'}
						</button>
					</div>
					<div className='firework left'>💥</div>
					<div className='firework right'>💥</div>
				</div>
			</div>

			<style jsx>{`
				.lucky-btn {
					position: fixed;
					bottom: calc(var(--safe-area-bottom, 0px) + 18px);
					left: 18px;
					width: 64px;
					height: 64px;
					background: #D4AF37;
					border-radius: 50%;
					display: flex;
					justify-content: center;
					align-items: center;
					cursor: pointer;
					z-index: 10002;
					box-shadow: 0 6px 18px rgba(0,0,0,0.12);
					animation: shake 2.2s infinite;
				}
				.lucky-icon { font-size: 30px; }
				.lucky-tooltip {
					position: absolute;
					bottom: calc(var(--safe-area-bottom, 0px) + 86px);
					left: 6px;
					background: #fff;
					color: #b71c1c;
					padding: 5px 10px;
					border-radius: 6px;
					font-weight: bold;
					white-space: nowrap;
					opacity: 0;
					transition: 0.2s;
					pointer-events: auto;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				.lucky-btn:hover .lucky-tooltip { opacity: 1; bottom: calc(var(--safe-area-bottom, 0px) + 92px); }
				.tooltip-close-btn {
					background: transparent;
					border: none;
					color: #b71c1c;
					font-size: 16px;
					font-weight: bold;
					cursor: pointer;
					line-height: 1;
					padding: 0;
					margin: 0;
					display: flex;
					align-items: center;
					justify-content: center;
					width: 16px;
					height: 16px;
					opacity: 0.7;
					transition: opacity 0.2s;
					flex-shrink: 0;
				}
				.tooltip-close-btn:hover { opacity: 1; }
				@keyframes shake {
					0% { transform: rotate(0deg); }
					5% { transform: rotate(10deg); }
					10% { transform: rotate(-10deg); }
					15% { transform: rotate(8deg); }
					20% { transform: rotate(0deg); }
					100% { transform: rotate(0deg); }
				}
				.lucky-modal {
					position: fixed;
					top: 0; left: 0;
					width: 100%; height: 100%;
					background: rgba(0,0,0,0.7);
					z-index: 10003;
					display: flex;
					justify-content: center;
					align-items: center;
					opacity: 0; pointer-events: none;
					transition: 0.28s;
				}
				.lucky-modal.active { opacity: 1; pointer-events: auto; }
				.modal-content {
					background: linear-gradient(135deg, #b71c1c, #8E0E00);
					width: 90%; max-width: 420px;
					padding: 36px;
					border-radius: 18px;
					text-align: center;
					color: #fff;
					border: 2px solid #D4AF37;
					position: relative;
					transform: scale(0.6);
					transition: 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
				}
				.lucky-modal.active .modal-content { transform: scale(1); }
				.modal-header { font-family: 'Cinzel', serif; font-size: 1.5rem; color: #FFD700; margin-bottom: 12px; }
				.discount-code {
					background: #fff; color: #b71c1c; padding: 8px; border-radius: 10px; border: 2px dashed #b71c1c; margin: 12px 0; font-size: 1.6rem;
				}
				.btn-copy {
					background: #FFD700; color: #b71c1c; border: none; padding: 10px 26px; border-radius: 999px; font-weight: 700; cursor: pointer;
				}
				.btn-copy:hover { background: #fff; }
				.close-btn {
					position: absolute; top: 10px; right: 14px; font-size: 28px; cursor: pointer; color: rgba(255,255,255,0.7); background: transparent; border: none;
				}
				.firework { position: absolute; font-size: 28px; animation: pop 1s infinite alternate; }
				.firework.left { top: -14px; left: -14px; }
				.firework.right { top: -14px; right: -14px; }
				@keyframes pop { from { transform: scale(1); } to { transform: scale(1.5); } }
			`}</style>
		</div>
	);
};

export default LuckyEnvelope;


