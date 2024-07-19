import { insertService } from "../queries";
import { Role, Service } from "../type";

export const seedServices = async (services: Service[]) => {
  for (const service of services) {
    await insertService(
      service.serviceId,
      service.secret,
      service.role || Role.VISITOR
    );
  }
};
