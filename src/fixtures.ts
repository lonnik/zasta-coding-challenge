import { Role, Service } from "./type";

export const services: Service[] = [
  { serviceId: "service1", secret: "secret", role: Role.VISITOR },
  { serviceId: "service2", secret: "secret", role: Role.TOKENIZER },
  { serviceId: "service3", secret: "secret", role: Role.DETOKENIZER },
];
