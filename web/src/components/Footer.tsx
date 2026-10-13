import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Wordmark from './Wordmark';

const Footer: React.FC = () => (
    <footer className="mk-footer">
        <div className="mk-shell">
            <div className="mk-footer-top">
                <div><h2>Take another look<br />at your lap.</h2></div>
                <a className="mk-button mk-button-primary" href="https://app.novationlabs.fr">Open the dashboard <ArrowUpRight size={17} /></a>
            </div>
            <div className="mk-footer-bottom">
                <Wordmark className="mk-footer-brand" />
                <div><a href="/about">About</a><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></div>
                <small>© {new Date().getFullYear()} Mokart</small>
            </div>
        </div>
    </footer>
);

export default Footer;
