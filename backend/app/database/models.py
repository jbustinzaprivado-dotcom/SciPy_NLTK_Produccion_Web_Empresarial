from datetime import date
from decimal import Decimal
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Content = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10000)]


class ClienteNuevo(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    nombre: Name
    empresa: str = Field(default="", max_length=200)
    correo: str = Field(default="", max_length=200)
    telefono: str = Field(default="", max_length=50)


class ComentarioNuevo(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    cliente_id: int | None = Field(default=None, gt=0)
    cliente_nombre: Name | None = None
    fecha: date
    tiempo_atencion_minutos: Decimal = Field(gt=0, le=99999999.99, max_digits=10, decimal_places=2, allow_inf_nan=False)
    comentario: Content

    @model_validator(mode="after")
    def cliente_requerido(self):
        if self.cliente_id is None and self.cliente_nombre is None:
            raise ValueError("Indica cliente_id o cliente_nombre")
        return self
class CategoriaNueva(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    descripcion: str = Field(default="", max_length=500)

class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    email: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1)