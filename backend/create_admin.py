import getpass
from app.database.connection import connect
from app.core.security import hash_password


def crear_admin():
    nombre = input("Nombre completo: ").strip()
    email = input("Email: ").strip().lower()
    password = getpass.getpass("Contraseña: ")
    confirmacion = getpass.getpass("Confirmar contraseña: ")

    if password != confirmacion:
        print("Las contraseñas no coinciden.")
        return
    if len(password) < 8:
        print("La contraseña debe tener al menos 8 caracteres.")
        return

    with connect() as db:
        existente = db.execute("SELECT id FROM usuarios WHERE email = %s", (email,)).fetchone()
        if existente:
            print(f"Ya existe un usuario con el email {email}.")
            return
        db.execute(
            "INSERT INTO usuarios(nombre, email, password_hash, rol) VALUES (%s, %s, %s, 'admin')",
            (nombre, email, hash_password(password)),
        )
        db.commit()

    print(f"Usuario admin '{email}' creado correctamente.")


if __name__ == "__main__":
    crear_admin()