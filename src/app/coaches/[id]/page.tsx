"use client";
import Button from "@/components/buttons/General";
import LoaderScreen from "@/components/Loaders/LoaderScreen";
import Modal from "@/components/modal/Modal";
import { EquipoEntrenadorService } from "@/modules/services/TeamCoachService";
import { TeamsServices } from "@/modules/services/TeamsService";
import { TeamCoach } from "@/modules/types/TeamCoach";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { TrashIcon } from "@heroicons/react/16/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EntrenadorDetalle() {

  const [createTeamModal, setCreateTeam] = useState(false);
  const [nombreEquipo, setNombreEquipo] = useState("");
  const { id: entrenadorId } = useParams();
  const queryClient = useQueryClient();
  const router = useRouter()

  const {
    data: teamCoach,
    isLoading: isLoadingEquipoEntrenador,
    error: errorLoadingEquipoEntrenador,
  } = useQuery({
    queryKey: ["teamCoach", entrenadorId],
    queryFn: () => EquipoEntrenadorService.getByEntrenador(parseInt(entrenadorId as string)),
    enabled: !!entrenadorId,
  });

  const getAllTeams = async (teamCoach: TeamCoach | undefined) => {
    if (!teamCoach || teamCoach.equiposIds.length === 0) return [];
    return await Promise.all(
      teamCoach.equiposIds.map((equipoId) => TeamsServices.getOne(equipoId))
    );
  };

  const {
    data: teams,
    isLoading: isLoadingTeams,
    error: errorLoadingTeams,
  } = useQuery({
    queryKey: ["Teams", entrenadorId, teamCoach],
    queryFn: () => getAllTeams(teamCoach),
    enabled: !!teamCoach,
  });

  useEffect(() => {
    if (!isLoadingEquipoEntrenador && errorLoadingEquipoEntrenador != null) {
      // No existe `teamCoach`, entonces se crea
      EquipoEntrenadorService.createEquipoEntrenador({
        entrenadorId: parseInt(entrenadorId as string),
        equiposIds: [],
        equipoSeleccionado: "",
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["teamCoach", entrenadorId] });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingEquipoEntrenador]);

  const handleSelectTeam = async (equipoId: string) => {
    if (!teamCoach) return
    await EquipoEntrenadorService.updateEquipoEntrenador(teamCoach?.id as string, {
      entrenadorId: parseInt(entrenadorId as string),
      equiposIds: teamCoach?.equiposIds as string[],
      equipoSeleccionado: equipoId,
    })
    queryClient.invalidateQueries({ queryKey: ["teamCoach", entrenadorId] });
  };

  const onSubmitTeam = async () => {
    await TeamsServices.createTeam({
      entrenadorId: entrenadorId as string,
      pokemonIds: [],
      nombre: nombreEquipo,
    });
  };

  const createTeamMutation = useMutation({
    mutationFn: onSubmitTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamCoach", entrenadorId] });
      setNombreEquipo("");
      setCreateTeam(false);
    },
  });

  const handleDeleteTeam = async (equipoId: string) => {
    await TeamsServices.deleteTeam(equipoId);
    queryClient.invalidateQueries({ queryKey: ["teamCoach", entrenadorId] });
  };

  if (isLoadingEquipoEntrenador || isLoadingTeams) return <LoaderScreen />;

  return (
    <div className="h-full flex flex-col items-center p-6 text-[var(--foreground)]">
      <div className="p-6 rounded-lg shadow-md max-w-3xl w-full">
        <div className="flex flex-row flex-wrap justify-around">
          <Button
            onClick={() => setCreateTeam(true)}
          >
            Crear nuevo equipo
          </Button>
        </div>



        <h2 className="text-xl font-bold mt-6">Equipos</h2>
        {errorLoadingTeams && (
          <p className="text-red-500">Error al cargar los equipos.</p>
        )}
        {errorLoadingEquipoEntrenador && (
          <p className="text-red-500">Error al cargar el equipo del entrenador.</p>
        )}
        {teamCoach && teamCoach.equiposIds?.length > 0 ? (
          teams && teams.length > 0 &&
          teams.map((team) => (
            <div key={team.id} className="mt-4 p-4 bg-[var(--background2)] rounded-md shadow-md flex justify-between items-center h-16">
              <h3 className="text-lg font-semibold">{team.nombre}</h3>
              <div className="flex min-w-16 justify-around flex-row gap-3">
                {teamCoach.equipoSeleccionado === team.id ? (
                  <span className="border-[1px] border-green-500 rounded-md p-2" >Equipo seleccionado</span>
                ) :
                  (
                    <Button onClick={() => handleSelectTeam(team.id)}>
                      Seleccionar
                    </Button>
                  )}
                <button title="Eliminar equipo" onClick={() => handleDeleteTeam(team.id)} className="text-red-500 hover:text-red-700 transition-all cursor-pointer">
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button title="Ver equipo" className="cursor-pointer"
                  onClick={() => router.push(`/manage-team/${team.id}`)}>
                  <ArrowRightIcon className="text-[var(--foreground2)] transition-transform transform hover:translate-x-1 h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[var(--foreground2)]">No hay equipos disponibles.</p>
        )}
      </div>

      <Modal
        isOpen={createTeamModal}
        title="Crear Nuevo Equipo"
        onClose={() => setCreateTeam(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTeamMutation.mutate();
          }}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="block text-[var(--foreground)] font-medium">
              Nombre del equipo:
            </label>
            <input
              type="text"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <Button
            type="submit"
          >
            Guardar Equipo
          </Button>
        </form>
      </Modal>

    </div>
  );
}
