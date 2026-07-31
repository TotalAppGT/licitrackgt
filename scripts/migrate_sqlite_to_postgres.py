"""
Migra las licitaciones de la base local SQLite (guatecompras.db) a PostgreSQL (Railway).
Uso:
    set DATABASE_URL=postgresql://...
    python migrate_sqlite_to_postgres.py
Opcional: --sqlite rutal/del/db.sqlite --limit 100000 (para probar)
"""
import argparse
import asyncio
import os
import sqlite3
from datetime import date

import asyncpg


COLS = ["nog", "ocid", "fecha_publicacion", "titulo", "entidad_compradora",
        "monto", "moneda", "estado", "categoria", "metodo", "modalidad",
        "departamento", "anio", "mes"]

BATCH = 5000


def build_insert(table, cols, conflict_col):
    return (f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join('$'+str(i+1) for i in range(len(cols)))}) "
            f"ON CONFLICT ({conflict_col}) DO NOTHING")


async def migrate(sqlite_path, pg_url, limit=None):
    sql = sqlite3.connect(sqlite_path)
    sql.row_factory = sqlite3.Row
    total = 0
    offset = 0
    conn = await asyncpg.connect(pg_url, timeout=60)
    await conn.execute("CREATE TABLE IF NOT EXISTS licitaciones ("
                       "id SERIAL PRIMARY KEY, nog VARCHAR(100) UNIQUE NOT NULL, ocid VARCHAR(100),"
                       "fecha_publicacion DATE, titulo TEXT, entidad_compradora VARCHAR(500),"
                       "monto DOUBLE PRECISION DEFAULT 0, moneda VARCHAR(10) DEFAULT 'GTQ',"
                       "estado VARCHAR(100), categoria VARCHAR(100), metodo VARCHAR(100),"
                       "modalidad VARCHAR(100), departamento VARCHAR(200), anio INTEGER, mes INTEGER,"
                       "created_at TIMESTAMPTZ DEFAULT now())")
    insert = build_insert("licitaciones", COLS, "nog")
    try:
        while True:
            rows = sql.execute(
                f"SELECT {','.join(COLS)} FROM licitaciones ORDER BY anio, mes, nog LIMIT {BATCH} OFFSET {offset}"
            ).fetchall()
            if not rows:
                break
            data = []
            for r in rows:
                fp = r["fecha_publicacion"]
                if fp:
                    try:
                        fp = date.fromisoformat(str(fp)[:10])
                    except ValueError:
                        fp = None
                data.append((r["nog"], r["ocid"], fp, r["titulo"], r["entidad_compradora"],
                             r["monto"], r["moneda"], r["estado"], r["categoria"],
                             r["metodo"], r["modalidad"], r["departamento"], r["anio"], r["mes"]))
            await conn.executemany(insert, data)
            total += len(data)
            offset += len(data)
            print(f"Migrados {total} registros...")
            if limit and total >= limit:
                break
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_licitaciones_anio_mes ON licitaciones(anio, mes)")
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_licitaciones_entidad ON licitaciones(entidad_compradora)")
    finally:
        await conn.close()
        sql.close()
    print(f"MIGRACION COMPLETADA: {total} registros")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sqlite", default=r"C:\Users\Dany\Documents\Licitaciones\guatecompras.db")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    pg_url = os.environ.get("DATABASE_URL")
    if not pg_url:
        raise SystemExit("Falta la variable DATABASE_URL (URL de PostgreSQL de Railway).")
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)
    asyncio.run(migrate(args.sqlite, pg_url, args.limit))
