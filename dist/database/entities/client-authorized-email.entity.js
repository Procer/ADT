"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthorizedEmail = void 0;
const typeorm_1 = require("typeorm");
const client_entity_1 = require("./client.entity");
let ClientAuthorizedEmail = class ClientAuthorizedEmail {
    id;
    clientId;
    client;
    emailAutorizado;
    asuntoClave;
    createdAt;
};
exports.ClientAuthorizedEmail = ClientAuthorizedEmail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClientAuthorizedEmail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id' }),
    __metadata("design:type", String)
], ClientAuthorizedEmail.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], ClientAuthorizedEmail.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_autorizado', unique: true }),
    __metadata("design:type", String)
], ClientAuthorizedEmail.prototype, "emailAutorizado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asunto_clave', default: 'SOLICITUD VIAJE' }),
    __metadata("design:type", String)
], ClientAuthorizedEmail.prototype, "asuntoClave", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ClientAuthorizedEmail.prototype, "createdAt", void 0);
exports.ClientAuthorizedEmail = ClientAuthorizedEmail = __decorate([
    (0, typeorm_1.Entity)('client_authorized_emails')
], ClientAuthorizedEmail);
//# sourceMappingURL=client-authorized-email.entity.js.map