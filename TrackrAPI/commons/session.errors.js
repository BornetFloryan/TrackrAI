const Config = require('./config');

const ERR_SESSION_ALREADY_ACTIVE = 700;
const ERR_SESSION_NOT_FOUND = 701;
const ERR_SESSION_INVALID_REQUEST = 702;
const ERR_SESSION_CANNOT_CREATE = 703;
const ERR_SESSION_CANNOT_CLOSE = 704;

const sessionErrors = [
    { number: ERR_SESSION_ALREADY_ACTIVE, status: 400, message: { en: 'session already active', fr: 'une session est déjà active' }},
    { number: ERR_SESSION_NOT_FOUND, status: 404, message: { en: 'session not found', fr: 'session introuvable' }},
    { number: ERR_SESSION_INVALID_REQUEST, status: 400, message: { en: 'invalid session request', fr: 'requête de session invalide' }},
    { number: ERR_SESSION_CANNOT_CREATE, status: 400, message: { en: 'cannot create session', fr: 'impossible de créer la session' }},
    { number: ERR_SESSION_CANNOT_CLOSE, status: 400, message: { en: 'cannot close session', fr: 'impossible de fermer la session' }},
];

const getError = (number, lang) => {
    if (lang === undefined) lang = Config.defaultLang;
    let err = sessionErrors.find(e => e.number === number);
    if (err !== undefined) {
        return {
            error: err.number,
            status: err.status,
            data: err.message[lang]
        };
    }
    return { error: 1, status: 500, data: 'undetermined error' };
};

module.exports = {
    ERR_SESSION_ALREADY_ACTIVE,
    ERR_SESSION_NOT_FOUND,
    ERR_SESSION_INVALID_REQUEST,
    ERR_SESSION_CANNOT_CREATE,
    ERR_SESSION_CANNOT_CLOSE,
    getError
};
