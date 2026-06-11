const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const fixPasswords = async () => {
  const users = [
    { email: 'admin@ecoclean.com', password: '123456' },
    { email: 'vendedor@ecoclean.com', password: '123456' },
    { email: 'revisor@ecoclean.com', password: '123456' },
    { email: 'gerente@ecoclean.com', password: '123456' },
    { email: 'dev@ecoclean.com', password: 'dev123456' },
  ];

  try {
    for (const user of users) {
      const result = await pool.query('SELECT id FROM usuarios WHERE email = $1', [user.email]);

      if (result.rows.length > 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query('UPDATE usuarios SET password = $1 WHERE email = $2', [hashedPassword, user.email]);
        console.log(`Contraseña actualizada: ${user.email}`);
      } else {
        console.log(`Usuario no encontrado: ${user.email}`);
      }
    }

    console.log('Fix de contraseñas completado');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

fixPasswords();
