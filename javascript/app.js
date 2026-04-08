const BIN_ID = "69d60e4f856a6821890e30d1"; 
const API_KEY = "$2a$10$GRr9rJefio3A6U3J0yA0j.AFZk1Me7JP1VuBtxJtFhDRrgnIMQhPy"; 

let data = {
    botones: [],
    mochila: [],
    tokensRecibidos: {},
    botonesVistos: {}
};

async function cargarDatos() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result && result.record) {
            data = result.record;
        } else if (result) {
            data = result;
        }
        
        asegurarEstructura();
        console.log("Datos cargados de la nube correctamente.", data);
        
    } catch (error) {
        console.error("Detalle del error:", error);
        alert("Aviso: No se pudo cargar el formato correcto de la nube. La web ha creado una base de datos limpia para que puedas empezar a añadir recuerdos. (Error real: " + error.message + ")");
        asegurarEstructura();
    }
}

async function guardarDatos() {
    try {
        const btnGuardar = document.querySelector('.admin-actions .btn-pink');
        if (btnGuardar) btnGuardar.innerText = "⏳ Guardando...";

        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        if (btnGuardar) btnGuardar.innerText = "Guardar en la Nube";
        console.log("¡Datos guardados en la nube con éxito!");
        
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un problema al guardar en la nube: " + error.message);
        const btnGuardar = document.querySelector('.admin-actions .btn-pink');
        if (btnGuardar) btnGuardar.innerText = "Guardar en la Nube";
    }
}

// Esta función ahora es irrompible. Si falta algo, lo crea.
function asegurarEstructura() {
    if (!data || typeof data !== 'object') data = {};
    if (!Array.isArray(data.botones)) data.botones = [];
    if (!Array.isArray(data.mochila)) data.mochila = [];
    if (!data.tokensRecibidos || typeof data.tokensRecibidos !== 'object') data.tokensRecibidos = {};
    if (!data.botonesVistos || typeof data.botonesVistos !== 'object') data.botonesVistos = {};
}

cargarDatos();


function intentarLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === "Truesky" && pass === "20240413") {
        cambiarPantalla('user-screen');
        renderizarBotonesUsuario();
    } else if (user === "Egot" && pass === "Lucy") {
        cambiarPantalla('admin-screen');
        renderizarPanelAdmin();
    } else {
        alert("Login incorrecto.");
    }
}

function cambiarPantalla(pantallaId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(pantallaId).classList.remove('hidden');
}

function cerrarSesion() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    cambiarPantalla('login-screen');
}


function renderizarBotonesUsuario() {
    const contenedor = document.getElementById('botones-container');
    contenedor.innerHTML = ''; 

    data.botones.forEach(boton => {
        const btnElement = document.createElement('button');
        btnElement.innerText = boton.textoBoton;
        
        if (data.botonesVistos[boton.textoBoton]) {
            btnElement.className = 'btn-accion btn-visto';
        } else {
            btnElement.className = 'btn-accion btn-nuevo';
        }
        
        btnElement.onclick = () => abrirVentanaBoton(boton);
        contenedor.appendChild(btnElement);
    });
}

async function abrirVentanaBoton(boton) {
    data.botonesVistos[boton.textoBoton] = true;
    let extraMsg = "";
    
    if (boton.token && boton.token.nombre) {
        let key = boton.textoBoton + "_" + boton.token.nombre;
        if (!data.tokensRecibidos[key]) {
            data.mochila.push(boton.token);
            data.tokensRecibidos[key] = true;
            extraMsg = `\n\n🎁 ¡SORPRESA! Has encontrado un regalo: ${boton.token.nombre} 🎁`;
        }
    }

    await guardarDatos();
    renderizarBotonesUsuario(); 
    mostrarModal(boton.textoBoton, boton.textoVentana + extraMsg, boton.nombreImagen);
}

function verMochila() {
    if (data.mochila.length === 0) {
        mostrarModal("🎒 Mi Mochila", "Tu mochila está vacía por ahora. ¡Sigue explorando nuestros recuerdos para encontrar regalos!");
        return;
    }

    let contenidoHTML = "";
    data.mochila.forEach((token, index) => {
        contenidoHTML += `
            <div class="regalo-card">
                <h3>🎁 ${token.nombre}</h3>
                <p>${token.descripcion}</p>
                <button class="btn-pink" onclick="usarRegalo(${index})">UTILIZAR ESTE REGALO</button>
            </div>
        `;
    });

    mostrarModal("🎒 Mi Mochila de Regalos", "", null, contenidoHTML);
}

async function usarRegalo(index) {
    let token = data.mochila[index];
    if (confirm(`¿Seguro que quieres utilizar '${token.nombre}' ahora mismo?`)) {
        data.mochila.splice(index, 1); 
        await guardarDatos();
        alert("¡Regalo canjeado! Haz una captura de pantalla y envíasela a tu amorcito para validarlo.");
        cerrarModal();
        if (data.mochila.length > 0) verMochila(); 
    }
}


function renderizarPanelAdmin() {
    const contenedor = document.getElementById('admin-list-container');
    contenedor.innerHTML = '';

    if (data.botones.length === 0) {
        contenedor.innerHTML = '<p>Aún no hay recuerdos añadidos.</p>';
        return;
    }

    data.botones.forEach((boton, index) => {
        const div = document.createElement('div');
        div.className = 'admin-item-row';
        div.innerHTML = `
            <span><strong>${boton.textoBoton}</strong> ${boton.token ? '🎁' : ''}</span>
            <div>
                <button class="btn-edit" onclick="editarRecuerdo(${index})">✏️ Editar</button>
                <button class="btn-delete" onclick="eliminarRecuerdo(${index})">🗑️ Borrar</button>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

async function guardarRecuerdoAdmin() {
    const index = parseInt(document.getElementById('edit-index').value);
    
    const textoBoton = document.getElementById('admin-textoBoton').value.trim();
    const textoVentana = document.getElementById('admin-textoVentana').value.trim();
    const nombreImagen = document.getElementById('admin-imagen').value.trim();
    
    const tokenNombre = document.getElementById('admin-tokenNombre').value.trim();
    const tokenDesc = document.getElementById('admin-tokenDesc').value.trim();

    if (!textoBoton || !textoVentana) {
        alert("El título del botón y el mensaje son obligatorios.");
        return;
    }

    let token = null;
    if (tokenNombre && tokenDesc) {
        token = { nombre: tokenNombre, descripcion: tokenDesc };
    }

    const nuevoBoton = {
        textoBoton: textoBoton,
        textoVentana: textoVentana,
        nombreImagen: nombreImagen || null,
        token: token
    };

    if (index === -1) {
        data.botones.push(nuevoBoton);
    } else {
        data.botones[index] = nuevoBoton;
    }

    await guardarDatos();
    renderizarPanelAdmin();
    limpiarFormularioAdmin();
    alert("¡Recuerdo guardado en la nube con éxito!");
}

function editarRecuerdo(index) {
    const boton = data.botones[index];
    
    document.getElementById('admin-form-title').innerText = "Modificar Recuerdo";
    document.getElementById('edit-index').value = index;
    
    document.getElementById('admin-textoBoton').value = boton.textoBoton;
    document.getElementById('admin-textoVentana').value = boton.textoVentana;
    document.getElementById('admin-imagen').value = boton.nombreImagen || '';
    
    if (boton.token) {
        document.getElementById('admin-tokenNombre').value = boton.token.nombre;
        document.getElementById('admin-tokenDesc').value = boton.token.descripcion;
    } else {
        document.getElementById('admin-tokenNombre').value = '';
        document.getElementById('admin-tokenDesc').value = '';
    }
}

async function eliminarRecuerdo(index) {
    if (confirm(`¿Seguro que quieres eliminar el recuerdo "${data.botones[index].textoBoton}"?`)) {
        data.botones.splice(index, 1);
        await guardarDatos();
        renderizarPanelAdmin();
    }
}

function limpiarFormularioAdmin() {
    document.getElementById('admin-form-title').innerText = "Añadir Nuevo Recuerdo";
    document.getElementById('edit-index').value = "-1";
    document.getElementById('admin-textoBoton').value = "";
    document.getElementById('admin-textoVentana').value = "";
    document.getElementById('admin-imagen').value = "";
    document.getElementById('admin-tokenNombre').value = "";
    document.getElementById('admin-tokenDesc').value = "";
}


// --- MODALES ---
function mostrarModal(titulo, texto, imagen, htmlPersonalizado = null) {
    document.getElementById('modal-title').innerText = titulo;
    
    const textEl = document.getElementById('modal-text');
    textEl.innerText = texto;
    
    const imgEl = document.getElementById('modal-img');
    if (imagen) {
        imgEl.src = 'imagenes/' + imagen;
        imgEl.classList.remove('hidden');
    } else {
        imgEl.classList.add('hidden');
    }

    const actionsEl = document.getElementById('modal-actions');
    if (htmlPersonalizado) {
        actionsEl.innerHTML = htmlPersonalizado;
        textEl.style.display = "none";
    } else {
        actionsEl.innerHTML = "";
        textEl.style.display = "block";
    }

    document.getElementById('modal').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modal').classList.add('hidden');
}