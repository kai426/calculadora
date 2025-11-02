document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de UI (Conexão com o DOM) ---
    
    const screen = document.querySelector('.screen');
    const calcButtons = document.querySelector('.calc-buttons');

    // Estado da calculadora
    let buffer = "0";

    // Ouve todos os cliques nos botões
    calcButtons.addEventListener('click', function(event) {
        if (!event.target.matches('button')) {
            return; // Sai se não for um botão
        }
        buttonClick(event.target.innerText);
    });

    /**
     * Roteia a ação baseada no botão clicado
     * @param {string} value - O texto do botão (ex: "7", "×", "C")
     */
    function buttonClick(value) {
        switch(value) {
            case 'C':
                limparVisor();
                break;
            case '←':
                apagarCaractere();
                break;
            case '=': // No seu HTML, o botão é &equals;
                calcular();
                break;
            case '+':
            case '−': // No seu HTML, o botão é &minus;
            case '×': // No seu HTML, o botão é &times;
            case '÷': // No seu HTML, o botão é &divide;
            case '.': // Adicionando suporte a decimal
            case '(': // Necessário para a atividade
            case ')': // Necessário para a atividade
                adicionarAoVisor(value);
                break;
            default:
                // Se for um número
                if (!isNaN(value)) {
                    handleNumber(value);
                }
                break;
        }
        // Atualiza o visor após qualquer ação
        screen.innerText = buffer;
    }

    function handleNumber(numberString) {
        if (buffer === "0" || buffer === "Erro") {
            buffer = numberString;
        } else {
            buffer += numberString;
        }
    }

    function adicionarAoVisor(valor) {
        if (buffer === "0" || buffer === "Erro") {
            // Permite iniciar com ( ou .
            if (valor === '(' || valor === '.') {
                 buffer = "0" + valor;
            } else {
                buffer = valor;
            }
        } else {
            buffer += valor;
        }
    }

    function limparVisor() {
        buffer = "0";
    }

    function apagarCaractere() {
        if (buffer === "Erro") {
            buffer = "0";
        } else if (buffer.length === 1) {
            buffer = "0";
        } else {
            buffer = buffer.substring(0, buffer.length - 1);
        }
    }

    /**
     * Função principal de cálculo chamada pelo botão "="
     */
    function calcular() {
        if (!buffer || buffer === "Erro") return;

        // 1. GUARDE A EXPRESSÃO ORIGINAL para o log
        const expressaoOriginalParaLog = buffer; 

        // 2. Padronize a expressão para o parser RPN
        const expressaoParaCalculo = buffer
            .replace(/×/g, '*') // Troca '×' por '*'
            .replace(/÷/g, '/') // Troca '÷' por '/'
            .replace(/−/g, '-'); // Troca '−' por '-'

        // 3. Calcule o resultado
        const resultado = calcularExpressao(expressaoParaCalculo);

        // 4. ATUALIZE O VISOR (buffer) com o resultado
        buffer = String(resultado);

        // 5. Salve no log APÓS o cálculo, usando a EXPRESSÃO ORIGINAL
        if (String(resultado) !== "Erro") {
            salvarNoLog(expressaoOriginalParaLog, resultado);
        }
    }

    // --- Lógica do Histórico (Log) - (Copiado da atividade) ---

    const btnToggleLog = document.getElementById('btn-toggle-log');
    if (btnToggleLog) {
        btnToggleLog.addEventListener('click', () => {
            toggleLog();
        });
    }

    function salvarNoLog(expressao, resultado) {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const logEntry = `[${dataFormatada} ${horaFormatada}] ${expressao} = ${resultado}`;
        let logs = JSON.parse(localStorage.getItem('calculadora_logs')) || [];
        logs.unshift(logEntry);

        if (logs.length > 50) {
            logs.pop();
        }

        localStorage.setItem('calculadora_logs', JSON.stringify(logs));
    }

    function toggleLog() {
        const logContainer = document.getElementById('log-container');
        const btnToggleLog = document.getElementById('btn-toggle-log');

        const estaVisivel = logContainer.style.display === 'block';

        if (estaVisivel) {
            logContainer.style.display = 'none';
            btnToggleLog.textContent = 'Ver Histórico';
        } else {
            logContainer.style.display = 'block';
            btnToggleLog.textContent = 'Esconder Histórico';
            carregarLogs();
        }
    }

    function carregarLogs() {
        const logLista = document.getElementById('log-lista');
        const logs = JSON.parse(localStorage.getItem('calculadora_logs')) || [];

        logLista.innerHTML = ''; // Limpa a lista antiga

        if (logs.length === 0) {
            logLista.innerHTML = '<li>Nenhum histórico salvo.</li>';
            return;
        }

        logs.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = entry;
            logLista.appendChild(li);
        });
    }

    // --- Lógica Principal (RPN) - (Copiado da atividade) ---

    /**
     * Função principal que o seu botão "=" deve chamar.
     * @param {string} expressionString - Ex: "2+(3*4)/9+50-(34/2)"
     * @returns {number|string} - O resultado ou uma mensagem de erro.
     */
    function calcularExpressao(expressionString) {
        try {
            const tokens = tokenizar(expressionString);
            const rpnTokens = infixToRpn(tokens);
            const resultado = avaliarRpn(rpnTokens);
            
            // Arredonda para evitar dízimas longas no visor
            if (String(resultado).includes('.')) {
                 return parseFloat(resultado.toFixed(8));
            }
            return resultado;
        } catch (error) {
            console.error("Erro no cálculo:", error.message);
            return "Erro";
        }
    }

    /**
     * Etapa 1: Tokenizar a expressão
     */
    function tokenizar(expression) {
        // Regex para encontrar números (incluindo decimais) OU operadores/parênteses
        const regex = /(\d+\.?\d*|\.\d+|[+\-*/()])/g;
        
        // Trata o caso de um operador negativo no início, ex: "-5+2"
        // Adiciona um "0" antes para virar "0-5+2"
        let exprPadronizada = expression;
        if (exprPadronizada.startsWith('-')) {
            exprPadronizada = '0' + exprPadronizada;
        }
        // Trata o caso de "(-" ex: "5*(-2)"
        // Adiciona um "0" para virar "5*(0-2)"
        exprPadronizada = exprPadronizada.replace(/\(-/g, '(0-');


        const tokens = exprPadronizada.match(regex);
        
        if (!tokens) {
            throw new Error("Expressão inválida");
        }
        return tokens;
    }

    /**
     * Etapa 2: Algoritmo Shunting-Yard (Infixo para RPN)
     */
    function infixToRpn(tokens) {
        const filaSaida = [];
        const pilhaOperadores = [];
        
        const precedencia = {
            '*': 2,
            '/': 2,
            '+': 1,
            '-': 1
        };

        const isOperador = (token) => ['+', '-', '*', '/'].includes(token);
        const isNumero = (token) => !isNaN(parseFloat(token));

        for (const token of tokens) {
            if (isNumero(token)) {
                filaSaida.push(token);
            } 
            else if (isOperador(token)) {
                while (
                    pilhaOperadores.length > 0 &&
                    isOperador(pilhaOperadores[pilhaOperadores.length - 1]) &&
                    precedencia[pilhaOperadores[pilhaOperadores.length - 1]] >= precedencia[token]
                ) {
                    filaSaida.push(pilhaOperadores.pop());
                }
                pilhaOperadores.push(token);
            } 
            else if (token === '(') {
                pilhaOperadores.push(token);
            } 
            else if (token === ')') {
                while (pilhaOperadores.length > 0 && pilhaOperadores[pilhaOperadores.length - 1] !== '(') {
                    filaSaida.push(pilhaOperadores.pop());
                }
                
                if (pilhaOperadores.length === 0) {
                    throw new Error("Parênteses desbalanceados");
                }
                
                pilhaOperadores.pop(); // Descarta o "("
            }
        }

        while (pilhaOperadores.length > 0) {
            const op = pilhaOperadores.pop();
            if (op === '(') {
                throw new Error("Parênteses desbalanceados");
            }
            filaSaida.push(op);
        }
        
        return filaSaida;
    }

    /**
     * Etapa 3: Avaliar a expressão RPN
     */
    function avaliarRpn(rpnTokens) {
        const pilha = [];

        for (const token of rpnTokens) {
            if (!isNaN(parseFloat(token))) {
                pilha.push(parseFloat(token));
            } else {
                if (pilha.length < 2) {
                    throw new Error("Expressão mal formada");
                }
                const b = pilha.pop();
                const a = pilha.pop();

                switch (token) {
                    case '+':
                        pilha.push(a + b);
                        break;
                    case '-':
                        pilha.push(a - b);
                        break;
                    case '*':
                        pilha.push(a * b);
                        break;
                    case '/':
                        if (b === 0) {
                            throw new Error("Divisão por zero");
                        }
                        pilha.push(a / b);
                        break;
                    default:
                        throw new Error("Operador desconhecido: " + token);
                }
            }
        }

        if (pilha.length !== 1) {
            throw new Error("Expressão mal formada");
        }
        
        return pilha[0];
    }

});