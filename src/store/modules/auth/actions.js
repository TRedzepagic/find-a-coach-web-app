let timer;
export default {
    async login(context, payload) {
       return context.dispatch('auth', {
            ...payload,
            mode: 'login'
        });
    },

    async signup(context, payload){
        return context.dispatch('auth', {
            ...payload,
            mode: 'signup'
        });
    },

    async auth(context, payload) {
        const mode = payload.mode;
        let url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDcNYPKtTQ6iwRuOhhj_k3akC89oFcoQog'
        
        if (mode === 'signup') {
            url =  'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDcNYPKtTQ6iwRuOhhj_k3akC89oFcoQog0';
        }
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                email: payload.email,
                password: payload.password,
                returnSecureToken: true
            })
        });

        const responseData = await response.json();

        if (!response.ok){
            const error = new Error(responseData.message || 'Failed to login.');
            throw error;
        }

        const expiresIn = +responseData.expiresIn * 1000;
        const expirationDate = new Date().getTime() + expiresIn;

        localStorage.setItem('token', responseData.idToken);
        localStorage.setItem('userId', responseData.userId);
        localStorage.setItem('tokenExpiration', expirationDate);

        timer = setTimeout(function(){
            context.dispatch('autoLogout');
        }, expiresIn);

        context.commit('setUser', {
            token: responseData.idToken,
            userId: responseData.localId,
        })
    },

    tryLogin(context) {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const tokenExpiration = localStorage.getItem('tokenExpiration');

        const expiresIn = +tokenExpiration - new Date().getTime();

        if (expiresIn < 0) {
            return;
        }

        timer = setTimeout(function() {
            context.dispatch('autologout');
        }, expiresIn)

        if (token && userId) {
            context.commit('setUser', {
                token: token,
                userId: userId,
            })
        }
    },

    logout(context){
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiration')
        localStorage.removeItem('userId');
        
        clearTimeout(timer);

        context.commit('setUser', {
            token: null,
            userId: null,
        })
    },

    autoLogout(context){
        context.dispatch('logout');
        context.commit('setAutoLogout')
    }
};
