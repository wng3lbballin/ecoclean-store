const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const seedUsers = async () => {
  const users = [
    { nombre: 'Administrador', email: 'admin@ecoclean.com', password: '123456', rol: 'admin' },
    { nombre: 'Vendedor', email: 'vendedor@ecoclean.com', password: '123456', rol: 'vendedor' },
    { nombre: 'Revisor', email: 'revisor@ecoclean.com', password: '123456', rol: 'revisor' },
    { nombre: 'Gerente', email: 'gerente@ecoclean.com', password: '123456', rol: 'gerente' },
  ];

  try {
    const hashedPassword = await bcrypt.hash('123456', 10);

    for (const user of users) {
      const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [user.email]);

      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4)',
          [user.nombre, user.email, hashedPassword, user.rol]
        );
        console.log(`Usuario creado: ${user.email} (${user.rol})`);
      } else {
        console.log(`Usuario ya existe: ${user.email}`);
      }
    }

    console.log('Seed de usuarios completado');
  } catch (err) {
    console.error('Error en seed:', err);
  }
};

module.exports = { seedUsers };
